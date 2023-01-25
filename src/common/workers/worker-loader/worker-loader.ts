/* eslint-disable @typescript-eslint/no-unused-vars */
import { Worker } from '../worker';
import { getWorkerClass } from './worker-loader.utils';

export abstract class WorkerLoader {
  public abstract setup(...args: unknown[]): Promise<void>;
  public abstract load(pointer: string, containerPath: string): Promise<Worker>;
}

export class DefaultWorkerLoader implements WorkerLoader {
  public async setup(...args: unknown[]): Promise<void> {
    //
  }
  public async load(
    pointer: string,
    containerPath: string,
    ...workerConstructorArgs: unknown[]
  ): Promise<Worker> {
    const WorkerClass = getWorkerClass(pointer, containerPath);
    const worker = new WorkerClass(...workerConstructorArgs) as Worker;
    return worker;
  }
}
