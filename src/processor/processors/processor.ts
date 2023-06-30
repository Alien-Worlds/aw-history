/* eslint-disable @typescript-eslint/no-unused-vars */
import { Worker } from '@alien-worlds/workers';
import { ProcessorTaskModel } from '../../common';
import { ProcessorSharedData } from '../processor.types';

export class Processor<
  SharedDataType = ProcessorSharedData
> extends Worker<SharedDataType> {
  public run(data: ProcessorTaskModel): Promise<void> {
    throw new Error('Method not implemented');
  }
}
