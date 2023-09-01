import { Block, BlockReader, log, parseToBigInt } from '@alien-worlds/aw-core';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
  ReaderBroadcastMessage,
} from '../broadcast';
import { ReaderDependencies } from './reader.dependencies';
import { BroadcastMessage } from '@alien-worlds/aw-broadcast';
import { ReadTaskData } from './reader.types';
import { ReaderConfig } from './reader.config';
import { BlockState, UnprocessedBlockQueue } from '../common';

/**
 * Updates the block state based on the highest block in the queue.
 *
 * @async
 * @param {UnprocessedBlockQueue} blockQueue - The block queue.
 * @param {BlockState} blockState - The block state.
 * @returns {Promise<void>}
 */
export const updateBlockState = async (
  blockQueue: UnprocessedBlockQueue,
  blockState: BlockState
): Promise<void> => {
  const { content: maxBlock } = await blockQueue.getMax();
  if (maxBlock) {
    const { failure } = await blockState.updateBlockNumber(
      maxBlock.thisBlock.blockNumber
    );
    if (failure) {
      log('Something went wrong, the block state was not updated.');
    }
  } else {
    log(
      'Something went wrong, the block with the highest number was not found/received.'
    );
  }
};

/**
 * Logs the reading progress of block numbers.
 *
 * @param {bigint[]} blockNumbers - Array of block numbers to log.
 */
export const logReadingProgress = (blockNumbers: bigint[]) => {
  const sorted = blockNumbers.sort();
  const min = sorted[0];
  const max = sorted.reverse()[0];

  log(`Blocks ${min.toString()}-${max.toString()} have been read.`);
};

/**
 * Handles the block when received. This involves adding it to the queue,
 * logging progress, updating block state, and handling any errors that occur.
 *
 * @async
 * @param {Block} block - The block received.
 * @param {ReadTaskData} task - The task data for reading blocks.
 * @param {UnprocessedBlockQueue} blockQueue - The block queue.
 * @param {BlockState} blockState - The block state.
 * @param {number} maxBytesSize - The max byte size for the unprocessed block collection.
 * @returns {Promise<void>}
 */
export const handleReceivedBlock = async (
  block: Block,
  task: ReadTaskData,
  blockQueue: UnprocessedBlockQueue,
  blockState: BlockState,
  blockReader: BlockReader,
  maxBytesSize
) => {
  const { startBlock, endBlock } = task;
  const isLast = endBlock === block.thisBlock.blockNumber;
  const isFastLane = block.thisBlock.blockNumber >= block.lastIrreversible.blockNumber;

  blockReader.pause();

  const { content: insertionResult, failure } = await blockQueue.add(block, {
    isFastLane,
    isLast,
    predictedRangeSize: Number(endBlock - startBlock),
  });

  if (failure) {
    log(failure.error);
  } else if (insertionResult) {
    await updateBlockState(blockQueue, blockState);
    logReadingProgress(insertionResult.insertedBlocks);

    if (insertionResult.queueOverloadSize > 0) {
      log(
        `The size limit ${maxBytesSize} of the unprocessed blocks collection has been exceeded ${insertionResult.queueOverloadSize}. Blockchain reading suspended until the collection is cleared.`
      );
      await blockQueue.waitForQueueToClear(1000, 10);
    }
    blockReader.resume();
  }
};

/**
 * Reads blocks in default mode. The function sets up the block reader,
 * listens for messages, and manages block reading tasks.
 *
 * @param {ReaderConfig} config - Configuration for the reader.
 * @param {ReaderDependencies} dependencies - Dependencies required by the reader.
 */
export const readBlocksInDefaultMode = (
  config: ReaderConfig,
  dependencies: ReaderDependencies
) => {
  let task: ReadTaskData;
  const { broadcastClient, blockReader, unprocessedBlockQueue, blockState } =
    dependencies;
  const {
    maxBlockNumber,
    blockReader: { shouldFetchDeltas, shouldFetchTraces, shouldFetchBlock },
  } = config;
  const channel = InternalBroadcastChannel.DefaultModeReader;
  const readyMessage = ReaderBroadcastMessage.defaultModeReady();

  log(`Reader started in "listening" mode`);
  broadcastClient.onMessage(channel, async (message: BroadcastMessage<ReadTaskData>) => {
    const { data, name } = message;
    task = data;
    if (name === InternalBroadcastMessageName.ReaderTask) {
      blockReader.readBlocks(
        task.startBlock,
        task.endBlock || parseToBigInt(maxBlockNumber || 0xffffffff),
        {
          shouldFetchBlock,
          shouldFetchDeltas,
          shouldFetchTraces,
        }
      );
    }
  });

  broadcastClient.connect();

  blockReader.onConnected(async () => {
    broadcastClient.sendMessage(readyMessage);
  });

  blockReader.onDisconnected(async () => {
    if (config.blockReader.autoReconnect === false) {
      blockReader.connect();
    }
  });

  blockReader.onReceivedBlock(async block =>
    handleReceivedBlock(
      block,
      task,
      unprocessedBlockQueue,
      blockState,
      blockReader,
      config.unprocessedBlockQueue.maxBytesSize
    )
  );

  blockReader.onError(error => {
    log(error);
  });

  blockReader.onComplete(async () => {
    log(`The block range (${task?.startBlock}-${task?.endBlock}) has been read`);
  });

  blockReader.connect();

  log(`Reader ... [ready]`);
};
