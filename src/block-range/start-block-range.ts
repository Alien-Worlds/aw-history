/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { BlockRangeScanner, setupBlockRangeScanner } from '../common/block-range-scanner';
import {
  BroadcastMessage,
  BroadcastMessageContentMapper,
  setupBroadcast,
} from '../common/broadcast';
import { Mode } from '../common/enums';
import { WorkerMessage } from '../common/workers/worker-message';
import { WorkerPool } from '../common/workers/worker-pool';
import { createBlockRangeBroadcastOptions } from './block-range.broadcast';
import { BlockRangeConfig } from './block-range.config';
import { BlockRangeMessageContent } from './block-range.message-content';
import {
  BlockRangeWorkerMessageContent,
  FeaturedDelta,
  FeaturedTrace,
} from './block-range.types';

const blockRangeTaskPath = './block-range.task';

export const handleWorkerMessage = async (
  message: WorkerMessage<BlockRangeWorkerMessageContent>,
  tools: { workerPool: WorkerPool; scanner: BlockRangeScanner },
  data: { mode: string; featuredTraces: FeaturedTrace[]; featuredDeltas: FeaturedDelta[] }
) => {
  const {
    content: { scanKey },
    pid,
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
  const scanner = await setupBlockRangeScanner(mongo, scannerConfig);

  while (
    (await scanner.hasUnscannedBlocks(input.scanKey)) &&
    workerPool.hasAvailableWorker()
  ) {
    const { start, end, scanKey } = await scanner.getNextScanNode(input.scanKey);
    const worker = workerPool.getWorker();
    worker.onMessage((message: WorkerMessage<BlockRangeWorkerMessageContent>) =>
      handleWorkerMessage(
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
  }
};

/**
 *
 * @param {BlockRangeMessageContent} input
 */
export const startSingleWorkerMode = (
  input: BlockRangeMessageContent,
  config: BlockRangeConfig
) => {
  const workerPool = new WorkerPool({
    threadsCount: 1,
    globalWorkerPath: blockRangeTaskPath,
    sharedData: { config },
  });
  const worker = workerPool.getWorker();
  worker.run(input);
};

export const handleBlockRangeMessage = async (
  message: BroadcastMessage<BlockRangeMessageContent>,
  config: BlockRangeConfig
) => {
  const { content } = message;

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
  const {
    broadcast: { url },
  } = config;
  const blockRangeBroadcastOptions = createBlockRangeBroadcastOptions(mapper);
  const broadcast = await setupBroadcast(url, blockRangeBroadcastOptions);

  broadcast.onMessage(
    blockRangeBroadcastOptions.queues[0].name,
    (message: BroadcastMessage<BlockRangeMessageContent>) =>
      handleBlockRangeMessage(message, config)
  );
};
