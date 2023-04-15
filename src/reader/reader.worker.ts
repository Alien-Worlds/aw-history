import { parseToBigInt } from '@alien-worlds/api-core';
import { Worker } from '../common/workers/worker';
import { BlockReader } from '../common/blockchain/block-reader';
import { ReaderConfig } from './reader.types';

export type ReaderSharedData = {
  config: ReaderConfig;
};

export default class ReaderWorker extends Worker<ReaderSharedData> {
  constructor(protected blockReader: BlockReader) {
    super();
  }

  public async run(startBlock: bigint, endBlock: bigint): Promise<void> {
    const { blockReader, sharedData } = this;
    const {
      config: {
        maxBlockNumber,
        blockReader: { shouldFetchDeltas, shouldFetchTraces },
      },
    } = sharedData;

    blockReader.onReceivedBlock(block => {
      this.progress(block.toJson());
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
        shouldFetchDeltas,
        shouldFetchTraces,
      }
    );
  }
}
