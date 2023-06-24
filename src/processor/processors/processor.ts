/* eslint-disable @typescript-eslint/no-unused-vars */
import { ProcessorSharedData } from '../processor.types';
import { Worker, ProcessorTaskModel } from '@alien-worlds/history-tools-common';

export class Processor<
  SharedDataType = ProcessorSharedData
> extends Worker<SharedDataType> {
  public run(data: ProcessorTaskModel): Promise<void> {
    throw new Error('Method not implemented');
  }
}
