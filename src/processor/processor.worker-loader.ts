import { connectMongo, MongoSource } from '@alien-worlds/api-core';
import { Worker } from '../common/workers';
import { DefaultWorkerLoader } from '../common/workers/worker-loader';
import { ProcessorSharedData } from './processor.types';

export default class ProcessorWorkerLoader extends DefaultWorkerLoader {
  private mongoSource: MongoSource;

  public async setup(sharedData: ProcessorSharedData): Promise<void> {
    const {
      config: { mongo },
    } = sharedData;
    const db = await connectMongo(mongo);
    this.mongoSource = new MongoSource(db);
  }

  public async load(pointer: string, containerPath: string): Promise<Worker> {
    const { mongoSource } = this;
    return super.load(pointer, containerPath, mongoSource);
  }
}
