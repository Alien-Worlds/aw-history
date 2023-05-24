/* eslint-disable @typescript-eslint/no-unused-vars */
import { ProcessorTaskModel } from '../processor-task-queue/processor-task.types';
import { DeltaProcessorInput } from './delta.processor.input';
import { Processor } from './processor';
import { ProcessorSharedData } from '../processor.types';

export class DeltaProcessor<
  DataType,
  SharedDataType = ProcessorSharedData
> extends Processor<SharedDataType> {
  protected input: DeltaProcessorInput<DataType>;

  public async run(data: ProcessorTaskModel): Promise<void> {
    this.input = DeltaProcessorInput.create<DataType>(data);
  }
}
