/* eslint-disable @typescript-eslint/no-unused-vars */
import { MongoSource } from '@alien-worlds/api-core';
import { ProcessorTaskModel } from '../../common/processor-task-queue/processor-task.types';
import { DeltaProcessorInput } from './delta.processor.input';
import { Processor } from './processor';

export class DeltaProcessor<DataType> extends Processor {
  protected input: DeltaProcessorInput<DataType>;

  constructor(protected mongoSource: MongoSource) {
    super();
  }

  public async run(data: ProcessorTaskModel): Promise<void> {
    this.input = DeltaProcessorInput.create<DataType>(data);
  }
}
