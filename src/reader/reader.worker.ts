/* eslint-disable @typescript-eslint/no-unused-vars */
import { Worker } from '@alien-worlds/aw-workers';
import { ReaderConfig } from './reader.config';
import { Block, BlockReader, log, parseToBigInt } from '@alien-worlds/aw-core';
import { UnprocessedBlockQueue, BlockState, BlockRangeScanner, Mode } from '../common';
import { BlockReaderNotConnected } from './reader.errors';

/**
 * The shared data type that the ReaderWorker class uses.
 * @typedef {Object} ReaderSharedData
 * @property {ReaderConfig} config - Configuration settings for the reader.
 */
export type ReaderSharedData = {
  config: ReaderConfig;
};

/**
 * A worker class that reads blocks and reports progress/errors. This class utilizes
 * the worker pattern to offload specific tasks away from the main thread.
 *
 * @extends {Worker<ReaderSharedData>}
 */
export default class ReaderWorker extends Worker<ReaderSharedData> {
  private startBlock: bigint;
  private endBlock: bigint;
  private scanKey: string;

  /**
   * Constructs a new ReaderWorker.
   *
   * @param {Object} dependencies - External services or classes required by the worker.
   * @param {BlockReader} dependencies.blockReader - A service for reading blocks.
   * @param {UnprocessedBlockQueue} dependencies.blockQueue - A queue for blocks that haven't been processed.
   * @param {BlockState} dependencies.blockState - Represents the state of a block.
   * @param {BlockRangeScanner} dependencies.scanner - A service for scanning block ranges.
   * @param {ReaderSharedData} sharedData - Shared data used by the worker.
   */
  constructor(
    protected dependencies: {
      blockReader: BlockReader;
      blockQueue: UnprocessedBlockQueue;
      blockState: BlockState;
      scanner: BlockRangeScanner;
    },
    protected sharedData: ReaderSharedData
  ) {
    super();
    this.sharedData = sharedData;
  }

  /**
   * Logs the progress of reading blocks.
   *
   * @private
   * @param {bigint[]} blockNumbers - List of block numbers that have been read.
   */
  private logProgress(blockNumbers: bigint[]) {
    const sorted = blockNumbers.sort();
    const min = sorted[0];
    const max = sorted.reverse()[0];

    log(`Blocks ${min.toString()}-${max.toString()} have been read.`);
  }

  /**
   * Handles a received block, logs progress, updates scanning progress, and handles potential errors.
   *
   * @private
   * @async
   * @param {Block} block - The block that has been received.
   */
  private async handleReceivedBlock(block: Block) {
    const {
      dependencies: { blockReader, blockQueue, scanner },
      sharedData: {
        config: { unprocessedBlockQueue },
      },
      startBlock,
      endBlock,
      scanKey,
    } = this;

    blockReader.pause();

    const { content: insertionResult, failure } = await blockQueue.add(block);

    if (failure) {
      log(failure.error);
      this.reject(failure.error);
    } else if (insertionResult) {
      this.logProgress(insertionResult.insertedBlocks);
      this.progress({ startBlock, endBlock, scanKey });

      for (const blockNumber of insertionResult.insertedBlocks) {
        await scanner.updateScanProgress(scanKey, blockNumber);
      }

      blockReader.resume();
    }
  }

  /**
   * Initiates the reading process for a range of blocks. Reports errors and progress accordingly.
   *
   * @public
   * @async
   * @param {Object} args - Arguments specifying the blocks to read.
   * @param {bigint} args.startBlock - The block number to start reading from.
   * @param {bigint} args.endBlock - The block number to end reading at.
   * @param {string} args.scanKey - The scanning key.
   * @returns {Promise<void>}
   */
  public async run(args: {
    startBlock: bigint;
    endBlock: bigint;
    scanKey: string;
  }): Promise<void> {
    const { startBlock, endBlock, scanKey } = args;
    const {
      dependencies: { blockReader },
      sharedData: {
        config: {
          blockReader: { shouldFetchDeltas, shouldFetchTraces, shouldFetchBlock },
        },
      },
    } = this;

    this.startBlock = startBlock;
    this.endBlock = endBlock;
    this.scanKey = scanKey;

    blockReader.onReceivedBlock(block => this.handleReceivedBlock(block));

    blockReader.onError(error => {
      this.reject(error);
    });

    blockReader.onComplete(async () => {
      this.resolve({ startBlock, endBlock, scanKey });
    });

    if (blockReader.isConnected()) {
      blockReader.readBlocks(startBlock, endBlock, {
        shouldFetchBlock,
        shouldFetchDeltas,
        shouldFetchTraces,
      });
    } else {
      this.reject(new BlockReaderNotConnected());
    }
  }
}
