import { Worker } from '@alien-worlds/workers';
import { ReaderConfig } from './reader.config';
import { log, parseToBigInt } from '@alien-worlds/api-core';
import { BlockReader } from '@alien-worlds/block-reader';
import { UnprocessedBlockQueue, BlockState, BlockRangeScanner, Mode } from '../common';

export type ReaderSharedData = {
  config: ReaderConfig;
};

export default class ReaderWorker extends Worker<ReaderSharedData> {
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

  private async updateBlockState(): Promise<void> {
    const {
      dependencies: { blockQueue, blockState },
    } = this;
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
  }

  private logProgress(blockNumbers: bigint[]) {
    const sorted = blockNumbers.sort();
    const min = sorted[0];
    const max = sorted.reverse()[0];

    log(`Blocks ${min.toString()}-${max.toString()} have been read.`);
  }

  private async readInDefaultMode(startBlock: bigint, endBlock: bigint) {
    const {
      dependencies: { blockReader, blockQueue },
      sharedData: {
        config: {
          maxBlockNumber,
          blockReader: { shouldFetchDeltas, shouldFetchTraces, shouldFetchBlock },
          unprocessedBlockQueue,
        },
      },
    } = this;
    const rangeSize = endBlock - startBlock;
    blockReader.onReceivedBlock(async block => {
      const isLast = endBlock === block.thisBlock.blockNumber;
      const isFastLane =
        block.thisBlock.blockNumber >= block.lastIrreversible.blockNumber;

      const { content: addedBlockNumbers, failure } = await blockQueue.add(block, {
        isFastLane,
        isLast,
        predictedRangeSize: Number(rangeSize),
      });

      if (Array.isArray(addedBlockNumbers) && addedBlockNumbers.length > 0) {
        this.logProgress(addedBlockNumbers);

        await this.updateBlockState();
        this.progress();
        //
      } else if (failure?.error.name === 'DuplicateBlocksError') {
        log(failure.error.message);
      } else if (failure?.error.name === 'UnprocessedBlocksOverloadError') {
        log(failure.error.message);
        log(
          `The size limit ${unprocessedBlockQueue.maxBytesSize} of the unprocessed blocks collection has been exceeded. Blockchain reading suspended until the collection is cleared.`
        );
      } else if (failure) {
        this.reject(failure.error);
      } else {
        //
      }
    });

    blockReader.onError(error => {
      this.reject(error);
    });

    blockReader.onComplete(async () => {
      this.resolve({ startBlock, endBlock });
    });

    blockReader.readBlocks(
      startBlock,
      endBlock || parseToBigInt(maxBlockNumber || 0xffffffff),
      {
        shouldFetchBlock,
        shouldFetchDeltas,
        shouldFetchTraces,
      }
    );
  }

  private async readInReplayMode(startBlock: bigint, endBlock: bigint, scanKey: string) {
    const {
      dependencies: { blockReader, blockQueue, scanner },
      sharedData: {
        config: {
          blockReader: { shouldFetchDeltas, shouldFetchTraces, shouldFetchBlock },
          unprocessedBlockQueue,
        },
      },
    } = this;

    const rangeSize = endBlock - startBlock;

    blockReader.onReceivedBlock(async block => {
      const { content: addedBlockNumbers, failure } = await blockQueue.add(block);
      if (Array.isArray(addedBlockNumbers) && addedBlockNumbers.length > 0) {
        this.logProgress(addedBlockNumbers);

        for (const blockNumber of addedBlockNumbers) {
          await scanner.updateScanProgress(scanKey, blockNumber);
        }

        this.progress({ startBlock, endBlock, scanKey });
        //
      } else if (failure?.error.name === 'DuplicateBlocksError') {
        log(failure.error.message);
      } else if (failure?.error.name === 'UnprocessedBlocksOverloadError') {
        log(failure.error.message);
        log(
          `The size limit ${unprocessedBlockQueue.maxBytesSize} of the unprocessed blocks collection has been exceeded by bytes. Blockchain reading suspended until the collection is cleared.`
        );
      } else if (failure) {
        this.reject(failure.error);
      }
    });

    blockReader.onError(error => {
      this.reject(error);
    });

    blockReader.onComplete(async () => {
      this.resolve({ startBlock, endBlock, scanKey });
    });

    blockReader.readBlocks(startBlock, endBlock, {
      shouldFetchBlock,
      shouldFetchDeltas,
      shouldFetchTraces,
    });
  }

  public async run(args: {
    startBlock: bigint;
    endBlock: bigint;
    scanKey: string;
  }): Promise<void> {
    const { startBlock, endBlock, scanKey } = args;
    const {
      sharedData: {
        config: { mode },
      },
    } = this;

    if (mode === Mode.Replay) {
      this.readInReplayMode(startBlock, endBlock, scanKey);
    } else if (mode === Mode.Default || mode === Mode.Test) {
      this.readInDefaultMode(startBlock, endBlock);
    } else {
      log(`Unknown mode ${mode}`);
    }
  }
}
