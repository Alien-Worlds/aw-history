import { WorkerPool } from '@alien-worlds/aw-workers';
import { ReadCompleteData, ReadTaskData } from './reader.types';
import { BlockRangeScanner, Mode } from '../common';
import { log } from '@alien-worlds/aw-core';
import { ReaderWorkerMessage } from './reader.worker-message';
import { ReaderConfig } from './reader.config';
import { ReaderDependencies } from './reader.dependencies';
import {
  FilterBroadcastMessage,
  InternalBroadcastChannel,
  ReaderBroadcastMessage,
} from '../broadcast';
import { readerWorkerLoaderPath } from './reader.consts';
import { BroadcastClient, BroadcastMessage } from '@alien-worlds/aw-broadcast';

let loop = false;
let currentTask: ReadTaskData;
let workerPool: WorkerPool;
let scanner: BlockRangeScanner;
let broadcastClient: BroadcastClient;

/**
 * Handles an error from a worker.
 *
 * @async
 * @param {number} id - The worker ID.
 * @param {Error} error - The error thrown by the worker.
 */
export const handleWorkerError = async (id: number, error: Error) => {
  log(`Worker error:`, error);
  workerPool.releaseWorker(id);
};

/**
 * Handles messages from a worker.
 *
 * @async
 * @param {ReaderWorkerMessage} message - The message from the worker.
 */
export const handleWorkerMessage = async (message: ReaderWorkerMessage) => {
  const { data, error, workerId } = message;

  if (message.isTaskResolved()) {
    const { startBlock, endBlock } = <ReadCompleteData>data;
    log(
      `All blocks in the range ${startBlock.toString()} - ${endBlock.toString()} (exclusive) have been read.`
    );
    workerPool.releaseWorker(workerId, data);
  } else if (message.isTaskRejected()) {
    log(`An unexpected error occurred while reading blocks...`, error);
    workerPool.releaseWorker(workerId);
  } else if (message.isTaskProgress()) {
    broadcastClient.sendMessage(FilterBroadcastMessage.refresh());
  } else {
    log(`Unhandled message`, message);
  }
};

/**
 * Reads blocks based on the task provided.
 * This function contains the main loop logic for managing tasks and worker threads.
 *
 * @async
 * @param {ReadTaskData} task - Data about which blocks to read.
 */
export const read = async (task: ReadTaskData) => {
  if (loop) {
    return;
  }
  loop = true;

  if (!currentTask) {
    currentTask = task;
    log(
      `Preparation for scanning block range (${task.startBlock}-${task.endBlock}) ${
        task.mode === Mode.Replay ? 'under the label ' + task.scanKey : ''
      }`
    );
  }

  while (loop) {
    const worker = await workerPool.getWorker();
    if (worker) {
      worker.onMessage((message: ReaderWorkerMessage) => handleWorkerMessage(message));
      worker.onError((id, error) => {
        log(`Worker error:`, error);
        workerPool.releaseWorker(id, task);
      });

      const scan = await scanner.getNextScanNode(task.scanKey);

      if (scan) {
        worker.run({
          startBlock: scan.start,
          endBlock: scan.end,
          scanKey: task.scanKey,
        });
      } else {
        log(
          `The scan of the range ${task.startBlock}-${task.endBlock}(exclusive) under the label "${task.scanKey}" has already been completed. No subranges to process.`
        );
        workerPool.releaseWorker(worker.id, task);
        loop = false;
      }
    } else {
      loop = false;
    }
  }
};

/**
 * Reads blocks in replay mode.
 * Configures and initializes worker threads to read blocks, listens for messages from these workers,
 * and manages tasks accordingly.
 *
 * @async
 * @param {ReaderConfig} config - Configuration settings for the reader.
 * @param {ReaderDependencies} dependencies - Necessary dependencies for the reader.
 */
export const readBlocksInReplayMode = async (
  config: ReaderConfig,
  dependencies: ReaderDependencies
) => {
  const { workerLoaderPath, workerLoaderDependenciesPath } = dependencies;
  const channel = InternalBroadcastChannel.DefaultModeReader;

  broadcastClient = dependencies.broadcastClient;
  scanner = dependencies.scanner;
  workerPool = await WorkerPool.create({
    ...config.workers,
    sharedData: { config },
    workerLoaderPath: workerLoaderPath || readerWorkerLoaderPath,
    workerLoaderDependenciesPath,
  });
  workerPool.onWorkerRelease(async (id, data: ReadTaskData) => {
    if (await scanner.hasUnscannedBlocks(data.scanKey)) {
      read(data);
    }
  });

  log(`Reader started in "listening" mode`);
  broadcastClient.onMessage(channel, async (message: BroadcastMessage<ReadTaskData>) => {
    const { data } = message;
    read(data);
  });

  broadcastClient.connect();
  broadcastClient.sendMessage(ReaderBroadcastMessage.replayModeReady());

  log(`Reader ... [ready]`);
};
