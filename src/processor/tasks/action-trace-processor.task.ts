/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ProcessorTask } from './processor.task';
import { ActionTraceProcessorTaskInput } from './action-trace-processor.task-input';
import { TraceProcessorTaskMessageContent } from '../broadcast/trace-processor-task.message-content';

export class ActionTraceProcessorTask<
  TaskInput = ActionTraceProcessorTaskInput
> extends ProcessorTask<TaskInput, TraceProcessorTaskMessageContent> {
  public deserialize(content: TraceProcessorTaskMessageContent): TaskInput {
    return ActionTraceProcessorTaskInput.create(this.abi, content) as TaskInput;
  }

  public run(data: TaskInput, sharedData: unknown): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
