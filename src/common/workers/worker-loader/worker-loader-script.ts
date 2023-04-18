import async from 'async';
import { workerData, parentPort } from 'worker_threads';
import { WorkerMessage, WorkerMessageName } from '../worker-message';
import { WorkerData } from '../worker.types';
import { Worker } from '../worker';
import { getWorkerLoader } from './worker-loader.utils';
import { WorkerLoader } from './worker-loader';

let worker: Worker;
let workerLoader: WorkerLoader;

export const messageHandler = async (message: WorkerMessage) => {
  const { pointer, sharedData, options } = workerData as WorkerData;
  if (message.name === WorkerMessageName.Setup) {
    //
    try {
      workerLoader = getWorkerLoader(options?.workerLoaderPath);
      await workerLoader.setup(sharedData);
      parentPort.postMessage(WorkerMessage.setupComplete(message.workerId));
    } catch (error) {
      parentPort.postMessage(WorkerMessage.setupFailure(message.workerId, error));
    }
  } else if (message.name === WorkerMessageName.Load) {
    //
    try {
      const { data } = <WorkerMessage<string>>message;
      worker = await workerLoader.load(data || pointer);
      parentPort.postMessage(WorkerMessage.loadComplete(message.workerId));
    } catch (error) {
      parentPort.postMessage(WorkerMessage.loadFailure(message.workerId, error));
    }
  } else if (message.name === WorkerMessageName.Dispose) {
    //
    try {
      worker = null;
      parentPort.postMessage(WorkerMessage.disposeComplete(message.workerId));
    } catch (error) {
      parentPort.postMessage(WorkerMessage.disposeFailure(message.workerId, error));
    }
  } else if (message.name === WorkerMessageName.RunTask) {
    //
    worker.run(message.data);
  }
};

const queue = async.queue(messageHandler);

parentPort.on('message', (message: WorkerMessage) => {
  queue.push(message);
});
