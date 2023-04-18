import { MongoSource } from '@alien-worlds/api-core';
import { Worker } from '../common/workers';
import { DefaultWorkerLoader } from '../common/workers/worker-loader';
import { ProcessorSharedData } from './processor.types';

export default class ProcessorWorkerLoader extends DefaultWorkerLoader {
  private mongoSource: MongoSource;

  public async setup(sharedData: ProcessorSharedData): Promise<void> {
    super.setup(sharedData);
    this.mongoSource = await MongoSource.create(sharedData.config.mongo);
  }

  public async load(pointer: string): Promise<Worker> {
    const { mongoSource } = this;
    return super.load(pointer, { mongoSource });
  }
}
