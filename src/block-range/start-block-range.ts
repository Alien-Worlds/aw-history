import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from './../internal-broadcast/internal-broadcast.enums';
import { log } from '@alien-worlds/api-core';
import { BlockRangeScanner, setupBlockRangeScanner } from '../common/block-range-scanner';
import { Mode } from '../common/common.enums';
import { FeaturedContractContent } from '../common/featured';
import { WorkerPool } from '../common/workers/worker-pool';
import { BlockRangeAddons, BlockRangeConfig } from './block-range.config';
import { InternalBroadcastMessage } from '../internal-broadcast/internal-broadcast.message';
import { startBlockRangeBroadcastClient } from './block-range.broadcast';
import {
  blockRangeDefaultModeTaskPath,
  blockRangeReplayModeTaskPath,
} from './block-range.consts';
import { WorkerMessage } from '../common/workers';
import { BlockRangeBroadcastMessages } from '../internal-broadcast/messages/block-range-broadcast.messages';
import { BlockRangeTaskData } from '../common/common.types';
import { Abis, setupAbis } from '../common/abis';

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
  const featured = new FeaturedContractContent(config.featured, addons.matchers);
  const workerPool = new WorkerPool({
    threadsCount,
    sharedData: { config, featured: featured.toJson() },
  });
  const scanner = await setupBlockRangeScanner(mongo, config.scanner);
  const abis = await setupAbis(config.mongo, config.abis, config.featured);
  // If the following options are given, the process will continue replay mode
  // regardless of whether the filler is running or not
  if (scanKey && mode === Mode.Replay) {
    startReplayMode(scanKey, abis, scanner, workerPool).catch(log);
  } else {
    // Runs the process in "listening mode" for tasks sent from the filler
    const broadcast = await startBlockRangeBroadcastClient(config.broadcast);

    broadcast.onMessage(
      InternalBroadcastChannel.BlockRange,
      async (message: InternalBroadcastMessage<BlockRangeTaskData>) => {
        if (message.content.name === InternalBroadcastMessageName.BlockRangeTask) {
          //
          log(` *  Block Range ... [new message]`);
          if (message.content.data.mode === Mode.Replay) {
            startReplayMode(scanKey, abis, scanner, workerPool).catch(log);
          } else {
            // start default mode
            const worker = workerPool.getWorker(blockRangeDefaultModeTaskPath);
            worker.run(message.content.data);
          }
        }
      }
    );
    // Everything is ready, notify the filler that the process is ready to work
    broadcast.sendMessage(BlockRangeBroadcastMessages.createBlockRangeReadyMessage());
  }

  log(`Block Range ... [ready]`);
};

export const startReplayMode = async (
  scanKey: string,
  abis: Abis,
  scanner: BlockRangeScanner,
  workerPool: WorkerPool
) => {
  const mode = Mode.Replay;
  let loop = true;

  // go through the loop of all available workers and assign them tasks to work on
  while (loop && workerPool.hasAvailableWorker()) {
    const node = await scanner.getNextScanNode(scanKey);

    if (node) {
      const { start, end } = node;
      await abis.getAbis(start, end, null, true);
      const worker = workerPool.getWorker(blockRangeReplayModeTaskPath);
      log(`  -  Block Range thread #${worker.id} ... [starting]`);

      worker.onMessage(handleBlockRangeWorkerMessage(workerPool, scanner, abis));
      worker.run({ startBlock: start, endBlock: end, mode, scanKey });
      log(`  -  Block Range thread #${worker.id} ... [ready]`);
    } else {
      loop = false;
    }
  }
  log(` *  Block Range multi (${workerPool.workerCount}) thread mode ... [ready]`);
};

export const handleBlockRangeWorkerMessage =
  (workerPool: WorkerPool, scanner: BlockRangeScanner, abis: Abis) =>
  async (message: WorkerMessage<BlockRangeTaskData>) => {
    const {
      data: { scanKey },
      workerId: pid,
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
        await abis.getAbis(start, end, null, true);
        const worker = workerPool.getWorker(blockRangeReplayModeTaskPath);
        worker.run({ startBlock: start, endBlock: end, mode: Mode.Replay, scanKey });
      }
    }
  };
