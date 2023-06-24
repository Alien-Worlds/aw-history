import ReaderWorker, { ReaderSharedData } from './reader.worker';
import {
  Worker,
  DefaultWorkerLoader,
  ReaderWorkerLoaderDependencies,
  log,
} from '@alien-worlds/history-tools-common';

export default class ReaderWorkerLoader extends DefaultWorkerLoader<
  ReaderSharedData,
  ReaderWorkerLoaderDependencies
> {
  public async setup(sharedData: ReaderSharedData): Promise<void> {
    const { config } = sharedData;
    await super.setup(sharedData, config);
    //
    const {
      unprocessedBlockQueue: { maxBytesSize, sizeCheckInterval },
    } = config;
    const {
      dependencies: { blockQueue: blocksQueue, blockReader },
    } = this;
    blocksQueue.onOverload(size => {
      const overload = size - maxBytesSize;
      log(`Overload: ${overload} bytes.`);
      blockReader.pause();

      let interval = setInterval(async () => {
        const { content: size, failure } = await blocksQueue.getBytesSize();

        if (failure) {
          log(
            `Failed to get unprocessed blocks collection size: ${failure.error.message}`
          );
        } else if (size === 0) {
          log(`Unprocessed blocks collection cleared, blockchain reading resumed.`);
          blockReader.resume();
          clearInterval(interval);
          interval = null;
        }
      }, sizeCheckInterval || 1000);
    });
    blocksQueue.beforeSendBatch(() => {
      blockReader.pause();
    });
    blocksQueue.afterSendBatch(() => {
      blockReader.resume();
    });

    await blockReader.connect();
  }

  public async load(): Promise<Worker> {
    const { dependencies, sharedData } = this;
    return new ReaderWorker(dependencies, sharedData);
  }
}
