/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { log } from '@alien-worlds/api-core';
import { BlockRangeScanner, setupBlockRangeScanner } from '../common/block-range-scanner';
import { BroadcastMessage } from '../common/broadcast';
import { Mode } from '../common/common.enums';
import { FeaturedContent } from '../common/featured';
import { WorkerMessage } from '../common/workers/worker-message';
import { WorkerPool } from '../common/workers/worker-pool';
import { setupBlockRangeBroadcast } from './broadcast/block-range.broadcast';
import { BlockRangeAddons, BlockRangeConfig } from './block-range.config';
import { BlockRangeMessageContent } from './broadcast/block-range.message-content';
import { BlockRangeWorkerMessageContent } from './block-range.types';

const blockRangeTaskPath = `${__dirname}/tasks/block-range.task`;

export const handleBlockRangeWorkerMessage =
  (
    tools: { workerPool: WorkerPool; scanner: BlockRangeScanner },
    data: { mode: string }
  ) =>
  async (message: WorkerMessage<BlockRangeWorkerMessageContent>) => {
    const {
      data: { scanKey },
      workerId: pid,
    } = message;
    const { mode } = data;
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
        worker.run(BlockRangeMessageContent.create(start, end, mode, scanKey));
      }
    }
  };

/**
 *
 * @param scanKey
 * @param scanner
 * @param workerPool
 */
export const startReplayMode = async (
  scanKey: string,
  scanner: BlockRangeScanner,
  workerPool: WorkerPool
) => {
  const mode = Mode.Replay;
  let loop = true;

  while (loop && workerPool.hasAvailableWorker()) {
    const node = await scanner.getNextScanNode(scanKey);

    if (node) {
      const worker = workerPool.getWorker();
      log(`  -  Block Range thread #${worker.id} ... [starting]`);

      worker.onMessage(handleBlockRangeWorkerMessage({ workerPool, scanner }, { mode }));
      worker.run(BlockRangeMessageContent.create(node.start, node.end, mode, scanKey));
      log(`  -  Block Range thread #${worker.id} ... [ready]`);
    } else {
      loop = false;
    }
  }
  log(` *  Block Range multi (${workerPool.workerCount}) thread mode ... [ready]`);
};

export const handleBlockRangeBroadcastMessage =
  (workerPool: WorkerPool, scanner: BlockRangeScanner) =>
  async (message: BroadcastMessage<BlockRangeMessageContent>) => {
    const { content } = message;
    const { scanKey, mode } = content;

    log(` *  Block Range ... [new message]`);

    if (mode === Mode.Replay) {
      startReplayMode(scanKey, scanner, workerPool).catch(log);
    } else {
      const worker = workerPool.getWorker();
      worker.run(content);
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
  addons: BlockRangeAddons = {}
) => {
  log(`Block Range ... [starting]`);
  const {
    scanKey,
    workers: { threadsCount },
    mode,
    mongo,
  } = config;
  const featured = new FeaturedContent(config.featured, addons.matchers);
  const workerPool = new WorkerPool({
    threadsCount,
    globalWorkerPath: blockRangeTaskPath,
    sharedData: { config, featured: featured.toJson() },
  });
  const scanner = await setupBlockRangeScanner(mongo, config.scanner);

  // by default bloc range has no BLLLLL params but in case if it is
  if (scanKey && mode === Mode.Replay) {
    startReplayMode(scanKey, scanner, workerPool).catch(log);
  } else {
    const broadcast = await setupBlockRangeBroadcast(config.broadcast);
    broadcast.onMessage(handleBlockRangeBroadcastMessage(workerPool, scanner));
    broadcast.sendProcessReadyMessage().catch(log);
  }

  log(`Block Range ... [ready]`);
};
