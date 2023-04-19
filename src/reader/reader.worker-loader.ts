import { MongoSource } from '@alien-worlds/api-core';
import { BlockReader } from '../common/blockchain';
import { Worker } from '../common/workers';
import { DefaultWorkerLoader } from '../common/workers/worker-loader';
import { UnprocessedBlockQueue } from './unprocessed-block-queue';
import ReaderWorker, { ReaderSharedData } from './reader.worker';
import { BlockRangeScanner, BlockState } from '../common';

export default class ReaderWorkerLoader extends DefaultWorkerLoader<ReaderSharedData> {
  private blockReader: BlockReader;
  private blockState: BlockState;
  private blocksQueue: UnprocessedBlockQueue;
  private scanner: BlockRangeScanner;

  public async setup(sharedData: ReaderSharedData): Promise<void> {
    super.setup(sharedData);

    const {
      config: {
        blockReader,
        mongo,
        blockQueueBatchSize,
        blockQueueMaxBytesSize,
        scanner,
      },
    } = sharedData;
    const mongoSource = await MongoSource.create(mongo);
    this.blockReader = await BlockReader.create(blockReader);
    this.blockState = await BlockState.create(mongoSource);
    this.scanner = await BlockRangeScanner.create(mongoSource, scanner);
    this.blocksQueue = await UnprocessedBlockQueue.create(
      mongoSource,
      blockQueueMaxBytesSize,
      blockQueueBatchSize
    );
    this.blocksQueue.onOverload(() => {
      this.blockReader.pause();
    });

    this.blocksQueue.onEmpty(() => {
      this.blockReader.resume();
    });

    await this.blockReader.connect();
  }

  public async load(): Promise<Worker> {
    const { blockReader, scanner, blocksQueue, blockState, sharedData } = this;
    return new ReaderWorker(blockReader, blocksQueue, blockState, scanner, sharedData);
  }
}
