/* eslint-disable @typescript-eslint/no-var-requires */

import { existsSync } from 'fs';
import path from 'path';
import { WorkerContainer } from '../worker-container';
import { InvalidPathError } from '../worker.errors';
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
  let filePath: string;
  if (pointer && !containerPath) {
    filePath = buildPath(pointer);
    if (existsSync(filePath) === false) {
      throw new InvalidPathError(filePath);
    }
    WorkerClass = require(filePath).default;
    //
  } else if (pointer && containerPath) {
    filePath = buildPath(containerPath);
    if (existsSync(filePath) === false) {
      throw new InvalidPathError(filePath);
    }
    const container: WorkerContainer = require(filePath).default;

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
    const loaderPath = buildPath(path);
    if (existsSync(loaderPath) === false) {
      throw new InvalidPathError(loaderPath);
    }
    const WorkerLoaderClass = require(loaderPath).default;
    return new WorkerLoaderClass() as WorkerLoader;
  }

  return new DefaultWorkerLoader();
};
