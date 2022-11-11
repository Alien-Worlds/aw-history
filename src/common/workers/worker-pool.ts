import { log } from '@alien-worlds/api-core';
import { WorkerProxy } from './worker-proxy';
import { MissingWorkerTaskPathError, WorkerTaskPathMismatchError } from './worker.errors';
import { getWorkersCount } from './worker.utils';

export type WorkerPoolOptions = {
  threadsCount?: number;
  inviolableThreadsCount?: number;
  globalWorkerPath?: string;
  sharedData?: unknown;
};

export class WorkerPool {
  public workerMaxCount: number;

  private globalWorkerPath: string;
  private availableWorkers: WorkerProxy[] = [];
  private activeWorkersByPid = new Map<number, WorkerProxy>();
  private sharedData: unknown;

  constructor(options: WorkerPoolOptions) {
    const { threadsCount, inviolableThreadsCount, globalWorkerPath, sharedData } =
      options;
    this.globalWorkerPath = globalWorkerPath;
    this.sharedData = sharedData;
    this.workerMaxCount =
      threadsCount > inviolableThreadsCount
        ? getWorkersCount(threadsCount, inviolableThreadsCount)
        : threadsCount;

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

  private createWorker(path: string): WorkerProxy {
    return new WorkerProxy(path, this.sharedData);
  }

  public getWorker(path?: string): WorkerProxy {
    const { globalWorkerPath, activeWorkersByPid, workerMaxCount, availableWorkers } =
      this;

    if (!path && !globalWorkerPath) {
      throw new MissingWorkerTaskPathError();
    }

    if (path && globalWorkerPath && path !== globalWorkerPath) {
      throw new WorkerTaskPathMismatchError(path, globalWorkerPath);
    }

    if (globalWorkerPath && activeWorkersByPid.size < workerMaxCount) {
      const worker = availableWorkers.pop();
      activeWorkersByPid.set(worker.id, worker);
      return worker;
    } else if (path && activeWorkersByPid.size < workerMaxCount) {
      const worker = this.createWorker(path);
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
    return this.availableWorkers.length > 0;
  }
}
