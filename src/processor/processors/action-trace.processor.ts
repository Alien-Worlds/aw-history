/* eslint-disable @typescript-eslint/no-unused-vars */
import { Processor } from './processor';
import { ActionTraceProcessorInput } from './action-trace.processor.input';
import { ProcessorTaskModel } from '../../common/processor-task-queue/processor-task.types';
import { MongoSource } from '@alien-worlds/api-core';

export class ActionTraceProcessor<DataType> extends Processor {
  protected input: ActionTraceProcessorInput<DataType>;

  constructor(protected mongoSource: MongoSource) {
    super();
  }

  public async run(data: ProcessorTaskModel, sharedData: unknown): Promise<void> {
    this.input = ActionTraceProcessorInput.create<DataType>(data);
  }
}
