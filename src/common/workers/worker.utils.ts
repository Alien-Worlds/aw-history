/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as os from 'os';
import { workerData } from 'worker_threads';
/**
 * Get the number of workers from configuration
 * or based on the number of available CPU cores.
 * The number of CPU cores is reduced by
 * a constant specified in the configuration.
 *
 * @param {Config} config
 * @returns {number}
 */
export const getWorkersCount = (
  threadsCount: number,
  inviolableThreadsCount = 0
): number => {
  if (threadsCount === 0 || isNaN(threadsCount)) {
    const cpus = os.cpus().length;
    return cpus - inviolableThreadsCount;
  }

  return threadsCount;
};

export const getSharedData = <T>() => workerData.sharedData as T;
