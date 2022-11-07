/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { log } from '@alien-worlds/api-core';
import { parentPort, Worker } from 'worker_threads';
import { WorkerMessage } from './worker-message';

export type TaskResolved = 'task_resolved';
export type TaskRejected = 'task_rejected';
export type TaskStatus = TaskResolved | TaskRejected;

/**
 * @class
 */
export class TaskResolver {
  public static resolve(value?: unknown): TaskResolved {
    parentPort.postMessage(WorkerMessage.taskResolved(process.pid, value));
    return 'task_resolved';
  }
  public static reject(error?: Error): TaskRejected {
    parentPort.postMessage(WorkerMessage.taskRejected(process.pid, error));
    return 'task_rejected';
  }
}

export class WorkerTask {
  constructor(private worker: Worker) {}

  public get id(): number {
    return this.worker.threadId;
  }

  public run(data: unknown): void {
    const { worker } = this;
    worker.postMessage(WorkerMessage.runTask(worker.threadId, data));
  }

  public onMessage(handler: (message: WorkerMessage) => Promise<void>) {
    this.worker.on('message', (message: WorkerMessage) => {
      handler(message).catch(log);
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
    return !!code;
  }
}
