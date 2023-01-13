import { Processor } from './processor';
import { ActionTraceProcessorInput } from './action-trace.processor.input';
import { ProcessorTaskModel } from '../../common/processor-queue/processor-task.types';

export class ActionTraceProcessor<
  TaskInput = ActionTraceProcessorInput
> extends Processor<TaskInput> {
  public use(data: unknown): void {
    throw new Error('Method not implemented.');
  }
  public async deserialize(content: ProcessorTaskModel): Promise<TaskInput> {
    return ActionTraceProcessorInput.create(content) as TaskInput;
  }

  public run(data: TaskInput, sharedData: unknown): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
