/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { WorkerTask } from '../../common/workers/worker-task';
import { Abi } from '../../common/abis';

export default class ProcessorTask<DataType = unknown> extends WorkerTask {
  private abi: Abi;

  public use(data: Abi): void {
    this.abi = data;
  }

  public async run(data: DataType, sharedData: unknown): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
