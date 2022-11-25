/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ProcessorTask } from './processor.task';
import { ActionTraceProcessorTaskInput } from './action-trace-processor.task-input';
import { TraceProcessorMessageContent } from '../broadcast/trace-processor.message-content';

export class ActionTraceProcessorTask<
  TaskInput = ActionTraceProcessorTaskInput
> extends ProcessorTask<TaskInput, TraceProcessorMessageContent> {
  public deserialize(content: TraceProcessorMessageContent): TaskInput {
    return ActionTraceProcessorTaskInput.create(this.abi, content) as TaskInput;
  }

  public run(data: TaskInput, sharedData: unknown): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
