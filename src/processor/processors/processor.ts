/* eslint-disable @typescript-eslint/no-unused-vars */
import { Worker } from '@alien-worlds/workers';
import { ProcessorSharedData } from '../processor.types';

export class Processor<
  ModelType,
  SharedDataType = ProcessorSharedData
> extends Worker<SharedDataType> {
  public run(model: ModelType): Promise<void> {
    throw new Error('Method not implemented');
  }
}
