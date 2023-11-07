import {
  Worker,
  DefaultWorkerLoader,
} from '@alien-worlds/aw-workers';
import { ReaderWorkerLoaderDependencies } from './reader.worker-loader.dependencies';
import ReaderWorker, { ReaderSharedData } from './reader.worker';
import { threadId } from 'worker_threads';
import { ReaderWorkerMessage } from './reader.worker-message';

export default class ReaderWorkerLoader extends DefaultWorkerLoader<
  ReaderSharedData,
  ReaderWorkerLoaderDependencies
> {
  public async setup(sharedData: ReaderSharedData): Promise<void> {
    const { config } = sharedData;
    await super.setup(sharedData, config);
    //
    const {
      dependencies: { blockReader },
    } = this;

    blockReader.onConnected(async () => {
      this.sendMessage(ReaderWorkerMessage.createBlockReaderConnectInfo(threadId));
    });

    blockReader.onDisconnected(async () => {
      this.sendMessage(ReaderWorkerMessage.createBlockReaderDisconnectWarning(threadId));
    });

    await blockReader.connect();
  }

  public async load(): Promise<Worker> {
    const { dependencies, sharedData } = this;
    return new ReaderWorker(dependencies, sharedData);
  }
}
