import { MongoSource } from '@alien-worlds/api-core';
import { ProcessorTaskModel } from '../processor-task-queue/processor-task.types';
import { Worker } from '../../common/workers/worker';
import { ProcessorSharedData } from '../processor.types';

export class Processor<
  SharedDataType = ProcessorSharedData
> extends Worker<SharedDataType> {
  protected mongoSource: MongoSource;

  constructor(components: { mongoSource: MongoSource }) {
    super();
    this.mongoSource = components.mongoSource;
  }
  public run(data: ProcessorTaskModel): Promise<void> {
    throw new Error('Method not implemented');
  }
}
