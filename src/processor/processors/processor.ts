/* eslint-disable @typescript-eslint/no-unused-vars */
import { ProcessorTaskModel } from '../processor-task-queue/processor-task.types';
import { Worker } from '../../common/workers/worker';
import { ProcessorSharedData } from '../processor.types';

export class Processor<
  SharedDataType = ProcessorSharedData
> extends Worker<SharedDataType> {
  public run(data: ProcessorTaskModel): Promise<void> {
    throw new Error('Method not implemented');
  }
}
