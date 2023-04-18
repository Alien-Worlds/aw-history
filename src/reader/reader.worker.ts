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

  public async run(args: {
    startBlock: bigint;
    endBlock: bigint;
    scanKey: string;
  }): Promise<void> {
    const { startBlock, endBlock, scanKey } = args;
    const { blockReader, blockQueue, blockState, scanner, sharedData } = this;
    const {
      config: {
        maxBlockNumber,
        blockReader: { shouldFetchDeltas, shouldFetchTraces, shouldFetchBlock },
        mode,
      },
    } = sharedData;
    const addedBlockNumbers: bigint[] = [];

    blockReader.onReceivedBlock(async block => {
      const { content, failure } = await blockQueue.add(block);
      if (failure) {
        log(failure);
      } else {
        addedBlockNumbers.push(...content);
        const max = content.reduce((max, current) => {
          return max < current ? current : max;
        }, 0n);
        if (mode === Mode.Default) {
          blockState.updateBlockNumber(max);
        }
      }
    });

    blockReader.onError(error => {
      this.reject(error);
    });

    blockReader.onComplete(async () => {
      if (mode === Mode.Replay) {
        for (const blockNumber of addedBlockNumbers) {
          await scanner.updateScanProgress(scanKey, blockNumber);
        }
      }
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
}
