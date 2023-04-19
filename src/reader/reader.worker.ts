import { log, parseToBigInt } from '@alien-worlds/api-core';
import { Worker } from '../common/workers/worker';
import { BlockReader } from '../common/blockchain/block-reader';
import { ReaderConfig } from './reader.types';
import { UnprocessedBlockQueue } from './unprocessed-block-queue';
import { BlockRangeScanner, BlockState, Mode } from '../common';

export type ReaderSharedData = {
  config: ReaderConfig;
};

export default class ReaderWorker extends Worker<ReaderSharedData> {
  constructor(
    protected blockReader: BlockReader,
    protected blockQueue: UnprocessedBlockQueue,
    protected blockState: BlockState,
    protected scanner: BlockRangeScanner,
    sharedData: ReaderSharedData
  ) {
    super();
    this.sharedData = sharedData;
  }

  private async readInDefaultMode(startBlock: bigint, endBlock: bigint) {
    const {
      blockReader,
      blockQueue,
      blockState,
      sharedData: {
        config: {
          maxBlockNumber,
          blockReader: { shouldFetchDeltas, shouldFetchTraces, shouldFetchBlock },
        },
      },
    } = this;

    blockReader.onReceivedBlock(async block => {
      const { content: addedBlockNumbers, failure } = await blockQueue.add(block);

      if (Array.isArray(addedBlockNumbers) && addedBlockNumbers.length > 0) {
        const { content: maxBlock } = await blockQueue.getMax();
        if (maxBlock) {
          const isUpdated = await blockState.updateBlockNumber(
            maxBlock.thisBlock.blockNumber
          );
          if (isUpdated === false) {
            log('Something went wrong, the block state was not updated.');
          }
        } else {
          log(
            'Something went wrong, the block with the highest number was not found/received.'
          );
        }
        this.progress();
      } else {
        if (failure) {
          if (failure.error.name === 'DuplicateBlocksError') {
            log(failure.error.message);
          } else {
            this.reject(failure.error);
          }
        } else {
          // Blocks received but still not enough to update database
          this.progress();
        }
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
      blockReader,
      blockQueue,
      scanner,
      sharedData: {
        config: {
          blockReader: { shouldFetchDeltas, shouldFetchTraces, shouldFetchBlock },
        },
      },
    } = this;
    const allAddedBlockNumbers: bigint[] = [];

    blockReader.onReceivedBlock(async block => {
      const { content: addedBlockNumbers, failure } = await blockQueue.add(block);
      if (Array.isArray(addedBlockNumbers) && addedBlockNumbers.length > 0) {
        allAddedBlockNumbers.push(...addedBlockNumbers);

        const sorted = addedBlockNumbers.sort();
        const startBlock = sorted[0];
        const endBlock = sorted.reverse()[0];
        this.progress({ startBlock, endBlock, scanKey });
      } else {
        if (failure) {
          if (failure.error.name === 'DuplicateBlocksError') {
            log(failure.error.message);
          } else {
            this.reject(failure.error);
          }
        } else {
          // Blocks received but still not enough to update database
          this.progress();
        }
      }
    });

    blockReader.onError(error => {
      this.reject(error);
    });

    blockReader.onComplete(async () => {
      for (const blockNumber of allAddedBlockNumbers) {
        await scanner.updateScanProgress(scanKey, blockNumber);
      }
      this.resolve({ startBlock, endBlock });
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
    } else if (mode === Mode.Default) {
      this.readInDefaultMode(startBlock, endBlock);
    }
  }
}
