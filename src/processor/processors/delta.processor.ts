import { ProcessorTaskModel } from '../../common/processor-queue/processor-task.types';
import { DeltaProcessorInput } from './delta.processor.input';
import { Processor } from './processor';

export class DeltaProcessor<
  TaskInput = DeltaProcessorInput
> extends Processor<TaskInput> {
  public use(data: unknown): void {
    throw new Error('Method not implemented.');
  }

  public async deserialize(content: ProcessorTaskModel): Promise<TaskInput> {
    return DeltaProcessorInput.create(content) as TaskInput;
  }

  public run(data: TaskInput, sharedData: unknown): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
