/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { log } from '@alien-worlds/api-core';
import { WorkerProxy } from './worker-proxy';
import {
  MissingWorkerPathError,
  WorkerPoolPathsConflictError,
  WorkerPathMismatchError,
} from './worker.errors';
import { WorkerPoolOptions } from './worker.types';
import { getWorkersCount } from './worker.utils';

export class WorkerPool {
  public workerMaxCount: number;

  private globalWorkerPath: string;
  private containerPath: string;
  private availableWorkers: WorkerProxy[] = [];
  private activeWorkersByPid = new Map<number, WorkerProxy>();
  private sharedData: unknown;

  constructor(options: WorkerPoolOptions) {
    const {
      threadsCount,
      inviolableThreadsCount,
      globalWorkerPath,
      sharedData,
      containerPath,
    } = options;
    this.globalWorkerPath = globalWorkerPath;
    this.containerPath = containerPath;
    this.sharedData = sharedData;
    this.workerMaxCount =
      threadsCount > inviolableThreadsCount
        ? getWorkersCount(threadsCount, inviolableThreadsCount)
        : threadsCount;

    if (containerPath && globalWorkerPath) {
      throw new WorkerPoolPathsConflictError();
    }

    if (globalWorkerPath) {
      for (let i = 0; i < this.workerMaxCount; i++) {
        const worker = this.createWorker(globalWorkerPath);
        this.availableWorkers.push(worker);
      }
    }
  }

  public get workerCount() {
    return this.availableWorkers.length + this.activeWorkersByPid.size;
  }

  private createWorker(pointer: string): WorkerProxy {
    const { sharedData, containerPath } = this;
    return new WorkerProxy(pointer, sharedData, { containerPath });
  }

  public getWorker(pointer?: string): WorkerProxy {
    const { globalWorkerPath, activeWorkersByPid, workerMaxCount, availableWorkers } =
      this;

    // Without an assigned process path, worker processes cannot be created.
    if (!pointer && !globalWorkerPath) {
      throw new MissingWorkerPathError();
    }

    // In the options, you can specify a path to a common/global process to all workers
    // also you can specify a path to a file with a list of available processes.
    // But you cannot specify both of these options at the same time!
    if (pointer && globalWorkerPath && pointer !== globalWorkerPath) {
      throw new WorkerPathMismatchError(pointer, globalWorkerPath);
    }

    if (globalWorkerPath && activeWorkersByPid.size < workerMaxCount) {
      // When workers are to run the same (global) process,
      // we use instance from the list (if there is any available)
      const worker = availableWorkers.pop();
      activeWorkersByPid.set(worker.id, worker);
      return worker;
    } else if (pointer && activeWorkersByPid.size < workerMaxCount) {
      // When workers are to run different processes,
      // we need to create new instances if the total number of available workers
      // does not exceed the maximum
      const worker = this.createWorker(pointer);
      activeWorkersByPid.set(worker.id, worker);
      return worker;
    } else {
      return null;
    }
  }

  public async releaseWorker(id: number, remove?: boolean): Promise<void> {
    const { activeWorkersByPid, availableWorkers, workerMaxCount } = this;
    const worker = activeWorkersByPid.get(id);

    if (worker && remove) {
      const result = await worker.remove();
      if (result) {
        this.activeWorkersByPid.delete(id);
      }
    } else if (worker && !remove) {
      this.activeWorkersByPid.delete(id);
      if (availableWorkers.length < workerMaxCount) {
        availableWorkers.push(worker);
      }
    } else {
      log(`No worker with the specified ID (${id}) was found`);
    }
  }

  public hasAvailableWorker(): boolean {
    return this.workerMaxCount - this.activeWorkersByPid.size > 0;
  }

  public hasActiveWorkers(): boolean {
    return this.activeWorkersByPid.size > 0;
  }

  public countAvailableWorker(): number {
    return this.workerMaxCount - this.activeWorkersByPid.size;
  }

  public countActiveWorkers(): number {
    return this.activeWorkersByPid.size;
  }
}
