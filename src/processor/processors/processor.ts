import { ProcessorTaskModel } from '../../common/processor-queue/processor-task.types';
import { Worker } from '../../common/workers/worker';

export abstract class Processor extends Worker {
  public abstract run(data: ProcessorTaskModel, sharedData: unknown): Promise<void>;
}
