/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { DeltaProcessorMessageContent } from '../broadcast/delta-processor.message-content';
import { DeltaProcessorTaskInput } from './delta-processor.task-input';
import { ProcessorTask } from './processor.task';

export class DeltaProcessorTask<
  TaskInput = DeltaProcessorTaskInput
> extends ProcessorTask<TaskInput, DeltaProcessorMessageContent> {
  //
  public deserialize(content: DeltaProcessorMessageContent): TaskInput {
    return DeltaProcessorTaskInput.create(this.abi, content) as TaskInput;
  }

  public run(data: TaskInput, sharedData: unknown): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
