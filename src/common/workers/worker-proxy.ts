/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { log } from '@alien-worlds/api-core';
import { Worker } from 'worker_threads';
import { WorkerMessage, WorkerMessageContent } from './worker-message';

export class WorkerProxy {
  private worker: Worker;

  constructor(private path: string, sharedData: unknown) {
    this.worker = new Worker(`${__dirname}/worker-loader`, {
      workerData: { path, sharedData },
    });
  }

  public get id(): number {
    return this.worker.threadId;
  }

  public use(data: unknown): void {
    const { worker } = this;
    worker.postMessage(WorkerMessage.use(worker.threadId, data).toJson());
  }

  public run(data: unknown): void {
    const { worker } = this;
    worker.postMessage(WorkerMessage.runTask(worker.threadId, data).toJson());
  }

  public onMessage(handler: (message: WorkerMessage) => Promise<void>) {
    this.worker.on('message', (content: WorkerMessageContent) => {
      handler(WorkerMessage.create(content)).catch(log);
    });
  }

  public onError(handler: (error: Error) => void) {
    this.worker.on('error', handler);
  }

  public onExit(handler: (code: number) => void) {
    this.worker.on('exit', handler);
  }

  public async remove(): Promise<boolean> {
    const code = await this.worker.terminate();
    return code > 0;
  }
}
