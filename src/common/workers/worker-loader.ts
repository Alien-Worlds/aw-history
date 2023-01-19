/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import path from 'path';
import async from 'async';
import { workerData, parentPort } from 'worker_threads';
import { WorkerMessage, WorkerMessageName } from './worker-message';
import { WorkerContainer } from './worker-container';
import { WorkerClass, WorkerData } from './worker.types';

type Worker = {
  run: (data: unknown, sharedData: unknown) => void;
  use: (data: unknown) => void | Promise<void>;
  deserialize?: (data: unknown) => unknown;
};

const buildPath = (filePath: string): string => {
  if (filePath.endsWith('.ts')) {
    require('ts-node').register();
    return path.resolve(process.cwd(), 'src', `${filePath}`);
  } else {
    return path.resolve(
      process.cwd(),
      'build',
      `${filePath}${filePath.endsWith('.js') ? '' : '.js'}`
    );
  }
};

const getWorkerClass = (pointer: string, containerPath: string): WorkerClass => {
  let WorkerClass;

  if (pointer && !containerPath) {
    WorkerClass = require(buildPath(pointer)).default;
    //
  } else if (pointer && containerPath) {
    const container: WorkerContainer = require(buildPath(containerPath)).default;

    WorkerClass = container.get(pointer);
  } else {
    throw new Error(`Neither "pointer" nor "containerPath" are given`);
  }

  if (!WorkerClass) {
    throw new Error(`Default class not found. Use "export default class ..."`);
  }
  return WorkerClass;
};

const { pointer, sharedData, options } = workerData as WorkerData;
let worker: Worker;

export const messageHandler = async (message: WorkerMessage) => {
  if (message.name === WorkerMessageName.Setup) {
    const { data } = <WorkerMessage<string>>message;
    const WorkerClass = getWorkerClass(data || pointer, options?.containerPath);
    worker = new WorkerClass() as Worker;
    parentPort.postMessage(WorkerMessage.setupComplete(message.workerId));
  } else if (message.name === WorkerMessageName.Dispose) {
    //
    worker = null;
    parentPort.postMessage(WorkerMessage.disposeComplete(message.workerId));
  } else if (message.name === WorkerMessageName.PassData) {
    //
    await worker.use(message.data);
  } else if (message.name === WorkerMessageName.RunTask) {
    //
    const data = worker.deserialize
      ? await worker.deserialize(message.data)
      : message.data;
    worker.run(data, sharedData);
  }
};

const queue = async.queue(messageHandler);

parentPort.on('message', (message: WorkerMessage) => {
  queue.push(message);
});
