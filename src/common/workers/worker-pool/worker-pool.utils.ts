import { WorkerPool } from './worker-pool';
import { WorkerPoolOptions } from '../worker.types';

export const createWorkerPool = async (options: WorkerPoolOptions) => {
  const pool = new WorkerPool();
  await pool.setup(options);
  return pool;
};
