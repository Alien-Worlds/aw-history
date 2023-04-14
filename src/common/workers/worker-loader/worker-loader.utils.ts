/* eslint-disable @typescript-eslint/no-var-requires */

import { existsSync } from 'fs';
import path from 'path';
import { InvalidPathError } from '../worker.errors';
import { DefaultWorkerLoader, WorkerLoader } from './worker-loader';

export const buildPath = (filePath: string): string => {
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

export const getWorkerLoader = (path: string): WorkerLoader => {
  if (path) {
    const loaderPath = buildPath(path);
    if (existsSync(loaderPath) === false) {
      throw new InvalidPathError(loaderPath);
    }
    const WorkerLoaderClass = require(loaderPath).default;
    return new WorkerLoaderClass() as WorkerLoader;
  }

  return new DefaultWorkerLoader();
};
