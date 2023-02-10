import { log, MongoSource } from '@alien-worlds/api-core';
import { Mode } from './../../common/common.enums';
import { setupBlockState } from '../../common/block-state';
import { ReceivedBlock, setupBlockReader } from '../../common/blockchain/block-reader';
import { Worker } from '../../common/workers/worker';
import {
  createDeltaProcessorTasks,
  createActionProcessorTasks,
} from './block-range-task.common';
import { setupProcessorTaskQueue } from '../../common/processor-task-queue';
import { BlockRangeTaskData } from '../../common/common.types';
import { setupAbis } from '../../common/abis';
import { ProcessorQueueBroadcastMessages } from '../../internal-broadcast/messages/processor-queue-broadcast.messages';
import { Broadcast } from '../../common/broadcast';
import { setupContractReader } from '../../common/blockchain/contract-reader';
import { BlockRangeSharedData } from '../block-range.types';

export default class BlockRangeDefaultModeTask extends Worker {
  constructor(protected mongoSource: MongoSource, protected broadcast: Broadcast) {
    super();
  }

  public async run(
    data: BlockRangeTaskData,
    sharedData: BlockRangeSharedData
  ): Promise<void> {
    const { mongoSource, broadcast } = this;
    const { startBlock, endBlock } = data;
    const { config, featured } = sharedData;
    const {
      blockReader: { shouldFetchDeltas, shouldFetchTraces },
    } = config;

    const contractReader = await setupContractReader(config.contractReader, mongoSource);
    const blockReader = await setupBlockReader(config.blockReader);
    const blockState = await setupBlockState(mongoSource);
    const processorQueue = await setupProcessorTaskQueue(mongoSource);
    const abis = await setupAbis(mongoSource, config.abis, config.featured);
    let currentBlock = startBlock;

    blockReader.onReceivedBlock(async (receivedBlock: ReceivedBlock) => {
      const {
        traces,
        deltas,
        block: { timestamp },
        thisBlock: { blockNumber },
      } = receivedBlock;

      const state = await blockState.getState();
      const actionProcessorTasks = await createActionProcessorTasks(
        contractReader,
        abis,
        Mode.Default,
        traces,
        featured.traces,
        blockNumber,
        timestamp
      );
      const deltaProcessorTasks = await createDeltaProcessorTasks(
        contractReader,
        abis,
        Mode.Default,
        deltas,
        featured.deltas,
        blockNumber,
        timestamp
      );
      const tasks = [...actionProcessorTasks, ...deltaProcessorTasks];

      // mark this block as a new state only if its index is not lower than the current state
      // and if it contains tasks (block number <= last irreversible block)
      if (blockNumber > state.blockNumber && tasks.length > 0) {
        blockState.newState(blockNumber);
      }

      if (tasks.length > 0) {
        log(
          `Block #${currentBlock} contains ${actionProcessorTasks.length} actions and ${deltaProcessorTasks.length} deltas to process (${tasks.length} tasks in total).`
        );
        await processorQueue.addTasks(tasks);
      } else {
        log(
          `The block (${blockNumber}) does not contain actions and deltas that could be processed.`
        );
      }
    });

    blockReader.onError(error => {
      this.reject(error);
    });

    blockReader.onComplete(async () => {
      //
      if (currentBlock < endBlock) {
        // notify Processor that new tasks have been added to the queue
        broadcast.sendMessage(ProcessorQueueBroadcastMessages.createUpdateMessage());
        // read next block
        currentBlock += 1n;
        blockReader.readOneBlock(currentBlock, {
          shouldFetchDeltas,
          shouldFetchTraces,
        });
      } else {
        this.resolve({ startBlock, endBlock });
      }
    });

    // start reading blockchain
    blockReader.readOneBlock(currentBlock, {
      shouldFetchDeltas,
      shouldFetchTraces,
    });
  }
}
