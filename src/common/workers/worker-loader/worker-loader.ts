/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { existsSync } from 'fs';
import { Worker } from '../worker';
import { buildPath } from './worker-loader.utils';
import { WorkerClass } from '../worker.types';
import { WorkerConstructorArgs } from './worker-loader.types';
import { UndefinedPointerError } from './worker-loader.errors';

export abstract class WorkerLoader<SharedDataType = unknown> {
  public abstract bindings: Map<string, WorkerClass>;

  public abstract setup(sharedData: SharedDataType, ...args: unknown[]): Promise<void>;
  public abstract load(
    pointer: string,
    workerConstructorArgs?: WorkerConstructorArgs
  ): Promise<Worker>;
}

export class DefaultWorkerLoader<SharedDataType = unknown>
  implements WorkerLoader<SharedDataType>
{
  public bindings: Map<string, WorkerClass> = new Map();
  protected sharedData: SharedDataType;

  public async setup(sharedData: SharedDataType, ...args: unknown[]): Promise<void> {
    this.sharedData = sharedData;
  }
  public async load(
    pointer: string,
    workerConstructorArgs?: WorkerConstructorArgs
  ): Promise<Worker> {
    let WorkerClass;

    if (!pointer) {
      throw new UndefinedPointerError();
    }

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
