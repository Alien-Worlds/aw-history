/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { existsSync } from 'fs';
import { Worker } from '../worker';
import { buildPath } from './worker-loader.utils';
import { WorkerClass } from '../worker.types';
import { WorkerConstructorArgs } from './worker-loader.types';

export abstract class WorkerLoader {
  public abstract bindings: Map<string, WorkerClass>;

  public abstract setup(...args: unknown[]): Promise<void>;
  public abstract load(
    pointer: string,
    workerConstructorArgs?: WorkerConstructorArgs
  ): Promise<Worker>;
}

export class DefaultWorkerLoader implements WorkerLoader {
  public bindings: Map<string, WorkerClass> = new Map();

  public async setup(...args: unknown[]): Promise<void> {
    //
  }
  public async load(
    pointer: string,
    workerConstructorArgs?: WorkerConstructorArgs
  ): Promise<Worker> {
    let WorkerClass;
    const filePath = buildPath(pointer);
    if (existsSync(filePath)) {
      WorkerClass = require(filePath).default;
    } else if (this.bindings.has(pointer)) {
      WorkerClass = this.bindings.get(pointer);
    } else {
      throw new Error(
        `A valid path to a worker was not specified or a worker was not assigned to the given name ${pointer}`
      );
    }

    const worker = new WorkerClass(workerConstructorArgs) as Worker;
    return worker;
  }
}
