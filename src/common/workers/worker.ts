/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Do not remove this file, it is required in WorkerPool
 */

import path from 'path';
import { workerData, parentPort } from 'worker_threads';

const { path: workerPath, sharedData } = workerData;
let workerFullPath;

if (!workerPath) {
  throw new Error(`Worker path not defined`);
}

if (!workerPath.endsWith('.ts')) {
  require('ts-node').register();
  workerFullPath = path.resolve(process.cwd(), 'src', `${workerPath}`);
} else {
  workerFullPath = path.resolve(process.cwd(), 'build', `${workerPath}`);
}

const { run } = require(workerFullPath);
if (run) {
  parentPort.on('message', data => {
    run(data, sharedData);
  });
} else {
  throw new Error(`"run" function not found in: ${workerPath}`);
}
