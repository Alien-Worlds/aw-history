/* eslint-disable @typescript-eslint/no-var-requires */

import path from 'path';
import { WorkerContainer } from '../worker-container';
import { WorkerClass } from '../worker.types';
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

export const getWorkerClass = (pointer: string, containerPath: string): WorkerClass => {
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

export const getWorkerLoader = (path: string): WorkerLoader => {
  if (path) {
    const WorkerLoaderClass = require(buildPath(path)).default;
    return new WorkerLoaderClass() as WorkerLoader;
  }

  return new DefaultWorkerLoader();
};
