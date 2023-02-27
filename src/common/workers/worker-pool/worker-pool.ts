/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { log } from '@alien-worlds/api-core';
import { WorkerProxy } from '../worker-proxy';
import {
  MissingWorkerPathError,
  WorkerPoolPathsConflictError,
  WorkerPathMismatchError,
} from '../worker.errors';
import { WorkerPoolOptions } from '../worker.types';
import { getWorkersCount } from '../worker.utils';

type Handler = (...args: unknown[]) => Promise<void> | void;

export class WorkerPool {
  public workerMaxCount: number;

  private globalWorkerPath: string;
  private containerPath: string;
  private workerLoaderPath: string;
  private availableWorkers: WorkerProxy[] = [];
  private activeWorkersByPid = new Map<number, WorkerProxy>();
  private sharedData: unknown;
  private workerReleaseHandler: Handler;

  public async setup(options: WorkerPoolOptions) {
    const {
      threadsCount,
      inviolableThreadsCount,
      globalWorkerPath,
      sharedData,
      containerPath,
      workerLoaderPath,
    } = options;
    this.globalWorkerPath = globalWorkerPath;
    this.containerPath = containerPath;
    this.workerLoaderPath = workerLoaderPath;
    this.sharedData = sharedData;
    this.workerMaxCount =
      threadsCount > inviolableThreadsCount
        ? getWorkersCount(threadsCount, inviolableThreadsCount)
        : threadsCount;

    if (containerPath && globalWorkerPath) {
      throw new WorkerPoolPathsConflictError();
    }

    for (let i = 0; i < this.workerMaxCount; i++) {
      const worker = await this.createWorker();
      this.availableWorkers.push(worker);
    }
  }

  public get workerCount() {
    return this.availableWorkers.length + this.activeWorkersByPid.size;
  }

  private async createWorker(): Promise<WorkerProxy> {
    const { sharedData, containerPath, workerLoaderPath } = this;
    const proxy = new WorkerProxy(sharedData, { workerLoaderPath, containerPath });
    await proxy.setup();
    return proxy;
  }

  public async getWorker(pointer?: string): Promise<WorkerProxy> {
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

    if (activeWorkersByPid.size < workerMaxCount) {
      // When workers are to run common or concrete process,
      // we use instance from the list (if there is any available)
      const worker = availableWorkers.shift();
      activeWorkersByPid.set(worker.id, worker);
      await worker.load(pointer || globalWorkerPath);
      return worker;
    } else {
      return null;
    }
  }

  public async releaseWorker(id: number): Promise<void> {
    const { activeWorkersByPid, availableWorkers, workerMaxCount, workerReleaseHandler } =
      this;
    const worker = activeWorkersByPid.get(id);

    if (worker) {
      await worker.dispose();
      this.activeWorkersByPid.delete(id);
      if (availableWorkers.length < workerMaxCount) {
        availableWorkers.push(worker);
      }
      if (workerReleaseHandler) {
        await workerReleaseHandler(id);
      }
    } else {
      log(`No worker with the specified ID #${id} was found`);
    }
  }

  public removeWorkers() {
    this.activeWorkersByPid.forEach(worker => worker.remove());
    this.availableWorkers.forEach(worker => worker.remove());
  }

  public hasAvailableWorker(): boolean {
    return this.workerMaxCount - this.activeWorkersByPid.size > 0;
  }

  public hasActiveWorkers(): boolean {
    return this.activeWorkersByPid.size > 0;
  }

  public countAvailableWorkers(): number {
    return this.workerMaxCount - this.activeWorkersByPid.size;
  }

  public countActiveWorkers(): number {
    return this.activeWorkersByPid.size;
  }

  public onWorkerRelease(handler: Handler): void {
    this.workerReleaseHandler = handler;
  }
}
