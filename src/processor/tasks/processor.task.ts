/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { WorkerTask } from '../../common/workers/worker-task';
import { Abi } from '../../common/abis';

export abstract class ProcessorTask<InputType = unknown, MessageContentType = unknown> extends WorkerTask {
  protected abi: Abi;

  public use(data: Abi): void {
    this.abi = data;
  }

  public abstract run(data: InputType, sharedData: unknown): Promise<void>;
  public abstract deserialize(data: MessageContentType): InputType;
}
