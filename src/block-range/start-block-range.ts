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
import { BlockRangeTaskInput } from './block-range.task-input';
import { BlockRangeWorkerMessageContent } from './block-range.types';

const blockRangeTaskPath = './block-range.task';

export const handleWorkerMessage = async (
  message: WorkerMessage<BlockRangeWorkerMessageContent>,
  workerPool: WorkerPool,
  scanner: BlockRangeScanner
) => {
  const {
    content: { scanKey },
    pid,
  } = message;

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
        BlockRangeTaskInput.create(
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
  input: BlockRangeTaskInput,
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
      handleWorkerMessage(message, workerPool, scanner)
    );
    worker.run(
      BlockRangeTaskInput.create(
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
 * @param {BlockRangeTaskInput} input
 */
export const startSingleWorkerMode = (
  input: BlockRangeTaskInput,
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
  message: BroadcastMessage<BlockRangeTaskInput>,
  config: BlockRangeConfig
) => {
  const { content } = message;

  if (content.mode === Mode.replay) {
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
    (message: BroadcastMessage<BlockRangeTaskInput>) =>
      handleBlockRangeMessage(message, config)
  );
};
