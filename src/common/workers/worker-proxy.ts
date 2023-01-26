import { log } from '@alien-worlds/api-core';
import { Worker } from 'worker_threads';
import {
  WorkerMessage,
  WorkerMessageContent,
  WorkerMessageName,
  WorkerMessageType,
} from './worker-message';
import { WorkerProxyOptions } from './worker.types';

export class WorkerProxy {
  private _pointer: string;
  private worker: Worker;

  constructor(sharedData: unknown, options: WorkerProxyOptions) {
    this.worker = new Worker(`${__dirname}/worker-loader/worker-loader-script`, {
      workerData: { sharedData, options },
    });
  }

  public get id(): number {
    return this.worker.threadId;
  }

  public get pointer(): string {
    return this._pointer;
  }

  public async setup(): Promise<void> {
    const { worker } = this;
    worker.removeAllListeners();
    return new Promise((resolveSetup, rejectSetup) => {
      worker.on('message', (content: WorkerMessageContent) => {
        const { type, name, data } = content;
        if (
          type === WorkerMessageType.System &&
          name === WorkerMessageName.SetupComplete
        ) {
          worker.removeAllListeners();
          resolveSetup();
        } else if (
          type === WorkerMessageType.System &&
          name === WorkerMessageName.SetupFailure
        ) {
          worker.removeAllListeners();
          rejectSetup(data);
        }
      });
      worker.postMessage(WorkerMessage.setup(worker.threadId).toJson());
    });
  }

  public async load(pointer: string): Promise<void> {
    this._pointer = pointer;
    const { worker } = this;
    worker.removeAllListeners();
    return new Promise((resolveLoad, rejectLoad) => {
      worker.on('message', (content: WorkerMessageContent) => {
        const { type, name, data } = content;
        if (
          type === WorkerMessageType.System &&
          name === WorkerMessageName.LoadComplete
        ) {
          worker.removeAllListeners();
          resolveLoad();
        } else if (
          type === WorkerMessageType.System &&
          name === WorkerMessageName.LoadFailure
        ) {
          worker.removeAllListeners();
          rejectLoad(data);
        }
      });
      worker.postMessage(WorkerMessage.load(worker.threadId, pointer).toJson());
    });
  }

  public async dispose(): Promise<void> {
    const { worker } = this;
    worker.removeAllListeners();
    return new Promise((resolveDispose, rejectDispose) => {
      worker.on('message', (content: WorkerMessageContent) => {
        const { type, name, data } = content;
        if (
          type === WorkerMessageType.System &&
          name === WorkerMessageName.DisposeComplete
        ) {
          worker.removeAllListeners();
          resolveDispose();
        } else if (
          type === WorkerMessageType.System &&
          name === WorkerMessageName.DisposeFailure
        ) {
          worker.removeAllListeners();
          rejectDispose(data);
        }
      });
      worker.postMessage(WorkerMessage.dispose(worker.threadId).toJson());
    });
  }

  public run<DataType = unknown>(data: DataType): void {
    const { worker } = this;
    worker.postMessage(WorkerMessage.runTask(worker.threadId, data).toJson());
  }

  public onMessage(handler: (message: WorkerMessage) => Promise<void>) {
    this.worker.on('message', (content: WorkerMessageContent) => {
      if (content.type !== WorkerMessageType.System) {
        handler(WorkerMessage.create(content)).catch(log);
      }
    });
  }

  public onError(handler: (error: Error) => void) {
    this.worker.on('error', handler);
  }

  public onExit(handler: (code: number) => void) {
    this.worker.on('exit', handler);
  }

  public async remove(): Promise<number> {
    const code = await this.worker.terminate();
    return code;
  }
}
