/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/**
 * Do not remove this file, it is required in WorkerProxy
 */

import path from 'path';
import fs from 'fs';
import { workerData, parentPort } from 'worker_threads';
import { WorkerMessage, WorkerMessageName } from './worker-message';

const { path: workerPath, sharedData } = workerData;
let workerFullPath;

if (!workerPath) {
  throw new Error(`Worker path not defined`);
}

const isSource = workerPath.endsWith('.ts');

if (isSource) {
  require('ts-node').register();
  workerFullPath = path.resolve(process.cwd(), 'src', `${workerPath}`);
} else {
  workerFullPath = path.resolve(
    process.cwd(),
    'build',
    `${workerPath}${workerPath.endsWith('.js') ? '' : '.js'}`
  );
}

if (!fs.existsSync(workerFullPath)) {
  throw new Error(`Wrong worker path: ${workerFullPath}`);
}

const WorkerTaskClass = require(workerFullPath).default;

if (!WorkerTaskClass) {
  throw new Error(`Default class not found. Use "export default class ..."`);
}

const worker = new WorkerTaskClass();

parentPort.on('message', (message: WorkerMessage) => {
  if (message.name === WorkerMessageName.PassData) {
    worker.use(message.data);
  } else if (message.name === WorkerMessageName.RunTask) {
    worker.run(message.data, sharedData);
  }
});
