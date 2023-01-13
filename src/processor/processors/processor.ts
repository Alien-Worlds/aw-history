import { ProcessorTaskModel } from '../../common/processor-queue/processor-task.types';
import { Worker } from '../../common/workers/worker';

export abstract class Processor<InputType = unknown> extends Worker {
  public abstract run(data: InputType, sharedData: unknown): Promise<void>;
  public abstract deserialize(data: ProcessorTaskModel): Promise<InputType>;
}
