import { MongoSource, log } from '@alien-worlds/api-core';
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
        blockQueueSizeCheckInterval,
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
    this.blocksQueue.onOverload(size => {
      const overload = size - blockQueueMaxBytesSize;
      log(`Overload: ${overload} bytes.`);
      this.blockReader.pause();

      let interval = setInterval(async () => {
        const { content: size, failure } = await this.blocksQueue.getBytesSize();

        if (failure) {
          log(
            `Failed to get unprocessed blocks collection size: ${failure.error.message}`
          );
        } else if (size === 0) {
          log(`Unprocessed blocks collection cleared, blockchain reading resumed.`);
          this.blockReader.resume();
          clearInterval(interval);
          interval = null;
        }
      }, blockQueueSizeCheckInterval || 1000);
    });
    this.blocksQueue.beforeSendBatch(() => {
      this.blockReader.pause();
    });
    this.blocksQueue.afterSendBatch(() => {
      this.blockReader.resume();
    });

    await this.blockReader.connect();
  }

  public async load(): Promise<Worker> {
    const { blockReader, scanner, blocksQueue, blockState, sharedData } = this;
    return new ReaderWorker(blockReader, blocksQueue, blockState, scanner, sharedData);
  }
}
