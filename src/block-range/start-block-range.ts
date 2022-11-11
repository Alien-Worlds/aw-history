/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { log } from '@alien-worlds/api-core';
import { BlockRangeScanner, setupBlockRangeScanner } from '../common/block-range-scanner';
import { BroadcastMessage, BroadcastMessageContentMapper } from '../common/broadcast';
import { Mode } from '../common/enums';
import { WorkerMessage } from '../common/workers/worker-message';
import { WorkerPool } from '../common/workers/worker-pool';
import { setupBlockRangeBroadcast } from './block-range.broadcast';
import { BlockRangeConfig } from './block-range.config';
import { BlockRangeMessageContent } from './block-range.message-content';
import {
  BlockRangeWorkerMessageContent,
  FeaturedDelta,
  FeaturedTrace,
} from './block-range.types';

const blockRangeTaskPath = `${__dirname}/tasks/block-range.task`;

export const handleBlockRangeWorkerMessage = async (
  message: WorkerMessage<BlockRangeWorkerMessageContent>,
  tools: { workerPool: WorkerPool; scanner: BlockRangeScanner },
  data: { mode: string; featuredTraces: FeaturedTrace[]; featuredDeltas: FeaturedDelta[] }
) => {
  const {
    data: { scanKey },
    workerId: pid,
  } = message;
  const { mode, featuredTraces, featuredDeltas } = data;
  const { workerPool, scanner } = tools;
  await workerPool.releaseWorker(pid);

  if (
    (await scanner.hasUnscannedBlocks(scanKey)) &&
    message.isTaskResolved() &&
    workerPool.hasAvailableWorker()
  ) {
    const scan = await scanner.getNextScanNode(scanKey);
    if (scan) {
      const { start, end } = scan;
      const worker = workerPool.getWorker();
      worker.run(
        BlockRangeMessageContent.create(
          start,
          end,
          mode,
          scanKey,
          featuredTraces,
          featuredDeltas
        )
      );
    }
  }
};

/**
 *
 * @param input
 * @param config
 */
export const startMultiWorkerMode = async (
  input: BlockRangeMessageContent,
  config: BlockRangeConfig
) => {
  const { threads, mongo, scanner: scannerConfig } = config;
  const { featuredTraces, featuredDeltas, mode } = input;
  const workerPool = new WorkerPool({
    threadsCount: threads,
    globalWorkerPath: blockRangeTaskPath,
    sharedData: { config },
  });
  log(` *  Block Range multi (${workerPool.workerCount}) thread mode ... [starting]`);
  const scanner = await setupBlockRangeScanner(mongo, scannerConfig);
  let workerCount = 0;
  while (
    (await scanner.hasUnscannedBlocks(input.scanKey)) &&
    workerPool.hasAvailableWorker()
  ) {
    log(`  -  Block Range thread #${++workerCount} ... [starting]`);
    const { start, end, scanKey } = await scanner.getNextScanNode(input.scanKey);
    const worker = workerPool.getWorker();
    worker.onMessage((message: WorkerMessage<BlockRangeWorkerMessageContent>) =>
      handleBlockRangeWorkerMessage(
        message,
        { workerPool, scanner },
        { featuredTraces, featuredDeltas, mode }
      )
    );
    worker.run(
      BlockRangeMessageContent.create(
        start,
        end,
        mode,
        scanKey,
        featuredTraces,
        featuredDeltas
      )
    );
    log(`  -  Block Range thread #${workerCount} ... [ready]`);
  }
  log(` *  Block Range multi (${workerPool.workerCount}) thread mode ... [ready]`);
};

/**
 *
 * @param {BlockRangeMessageContent} input
 */
export const startSingleWorkerMode = (
  input: BlockRangeMessageContent,
  config: BlockRangeConfig
) => {
  log(` *  Block Range single thread mode ... [starting]`);
  const workerPool = new WorkerPool({
    threadsCount: 1,
    globalWorkerPath: blockRangeTaskPath,
    sharedData: { config },
  });
  const worker = workerPool.getWorker();
  worker.run(input);
  log(` *  Block Range single thread mode ... [ready]`);
};

export const handleBlockRangeMessage = async (
  message: BroadcastMessage<BlockRangeMessageContent>,
  workerPool: WorkerPool,
  config: BlockRangeConfig
) => {
  const { content } = message;

  log(` *  Block Range ... [new message]`);

  if (content.mode === Mode.Replay) {
    await startMultiWorkerMode(content, config);
  } else {
    startSingleWorkerMode(content, config);
  }
};

/**
 *
 * @param broadcastMessageMapper
 * @param config
 * @returns
 */
export const startBlockRange = async (
  config: BlockRangeConfig,
  mapper?: BroadcastMessageContentMapper
) => {
  log(`Block Range ... [starting]`);
  const broadcast = await setupBlockRangeBroadcast(config.broadcast, mapper);
  const workerPool = new WorkerPool({
    threadsCount: 1,
    globalWorkerPath: blockRangeTaskPath,
    sharedData: { config },
  });
  log(`Block Range ... [ready]`);
  log(`  >  Waiting for incoming messages ...`);

  broadcast.onMessage((message: BroadcastMessage<BlockRangeMessageContent>) =>
    handleBlockRangeMessage(message, workerPool, config)
  );
};
