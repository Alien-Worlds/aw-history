/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { log } from '@alien-worlds/api-core';
import { WorkerProxy } from './worker-proxy';
import { WorkerPoolOptions } from './worker.types';
import { getWorkersCount } from './worker.utils';

type WorkerReleaseHandler = (id: number, data?: unknown) => Promise<void> | void;

export class WorkerPool<WorkerType = Worker> {
  public static async create<WorkerType = Worker>(options: WorkerPoolOptions) {
    const pool = new WorkerPool<WorkerType>();
    await pool.setup(options);
    return pool;
  }

  public workerMaxCount: number;

  private workerLoaderPath: string;
  private availableWorkers: WorkerProxy[] = [];
  private activeWorkersByPid = new Map<number, WorkerProxy>();
  private sharedData: unknown;
  private workerReleaseHandler: WorkerReleaseHandler;

  public async setup(options: WorkerPoolOptions) {
    const {
      threadsCount,
      inviolableThreadsCount,
      sharedData,
      workerLoaderPath,
    } = options;
    this.workerLoaderPath = workerLoaderPath;
    this.sharedData = sharedData;
    this.workerMaxCount =
      threadsCount > inviolableThreadsCount
        ? getWorkersCount(threadsCount, inviolableThreadsCount)
        : threadsCount;

    for (let i = 0; i < this.workerMaxCount; i++) {
      const worker = await this.createWorker();
      this.availableWorkers.push(worker);
    }
  }

  public get workerCount() {
    return this.availableWorkers.length + this.activeWorkersByPid.size;
  }

  private async createWorker(): Promise<WorkerProxy> {
    const { sharedData, workerLoaderPath } = this;
    const proxy = new WorkerProxy(sharedData, { workerLoaderPath });
    await proxy.setup();
    return proxy;
  }

  public async getWorker(pointer?: string): Promise<WorkerType & WorkerProxy> {
    const { activeWorkersByPid, workerMaxCount, availableWorkers } =
      this;

    if (activeWorkersByPid.size < workerMaxCount) {
      // When workers are to run common or concrete process,
      // we use instance from the list (if there is any available)
      const worker = availableWorkers.shift();
      activeWorkersByPid.set(worker.id, worker);
      await worker.load(pointer);
      return worker as WorkerType & WorkerProxy;
    } else {
      return null;
    }
  }

  public async releaseWorker(id: number, data?: unknown): Promise<void> {
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
        await workerReleaseHandler(id, data);
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

  public onWorkerRelease(handler: WorkerReleaseHandler): void {
    this.workerReleaseHandler = handler;
  }
}
