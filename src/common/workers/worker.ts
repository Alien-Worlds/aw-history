/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { parentPort, threadId } from 'worker_threads';
import { WorkerMessage } from './worker-message';

export type TaskResolved = 'task_resolved';
export type TaskRejected = 'task_rejected';
export type TaskStatus = TaskResolved | TaskRejected;

export abstract class Worker<DataType = unknown, SharedDataType = unknown> {
  public get id(): number {
    return threadId;
  }

  public abstract run(data: DataType, sharedData: SharedDataType): void;

  public deserialize(data: unknown): unknown {
    throw new Error('Method not implemented');
  }

  public resolve(data?: unknown): TaskResolved {
    parentPort.postMessage(WorkerMessage.taskResolved(threadId, data).toJson());
    return 'task_resolved';
  }

  public reject(error?: Error): TaskRejected {
    parentPort.postMessage(WorkerMessage.taskRejected(threadId, error).toJson());
    return 'task_rejected';
  }
}
