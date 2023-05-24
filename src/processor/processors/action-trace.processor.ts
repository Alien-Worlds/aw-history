/* eslint-disable @typescript-eslint/no-unused-vars */
import { Processor } from './processor';
import { ActionTraceProcessorInput } from './action-trace.processor.input';
import { ProcessorTaskModel } from '../processor-task-queue/processor-task.types';
import { ProcessorSharedData } from '../processor.types';

export class ActionTraceProcessor<
  DataType = unknown,
  SharedDataType = ProcessorSharedData
> extends Processor<SharedDataType> {
  protected input: ActionTraceProcessorInput<DataType>;

  public async run(data: ProcessorTaskModel): Promise<void> {
    this.input = ActionTraceProcessorInput.create<DataType>(data);
  }
}
