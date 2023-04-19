/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { parentPort, threadId } from 'worker_threads';
import { WorkerMessage } from './worker-message';

export type TaskResolved = 'task_resolved';
export type TaskRejected = 'task_rejected';
export type TaskProgress = 'task_progress';
export type TaskStatus = TaskResolved | TaskRejected | TaskProgress;

export class Worker<SharedDataType = unknown> {
  public get id(): number {
    return threadId;
  }

  protected sharedData: SharedDataType;
  private isRejected = false;

  public run(...args: unknown[]): void {
    throw new Error('Method not implemented');
  }

  public deserialize(data: unknown): unknown {
    throw new Error('Method not implemented');
  }

  public resolve<DataType = unknown>(data?: DataType): TaskResolved {
    if (this.isRejected === false) {
      parentPort.postMessage(
        WorkerMessage.taskResolved<DataType>(threadId, data).toJson()
      );
      return 'task_resolved';
    }
  }

  public reject(error?: Error): TaskRejected {
    parentPort.postMessage(WorkerMessage.taskRejected(threadId, error).toJson());
    this.isRejected = true;
    return 'task_rejected';
  }

  public progress<DataType = unknown>(data?: DataType): TaskProgress {
    parentPort.postMessage(WorkerMessage.taskProgress<DataType>(threadId, data).toJson());
    return 'task_progress';
  }
}
