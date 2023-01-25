import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from './../internal-broadcast/internal-broadcast.enums';
import { log } from '@alien-worlds/api-core';
import { BlockRangeScanner, setupBlockRangeScanner } from '../common/block-range-scanner';
import { Mode } from '../common/common.enums';
import { FeaturedContractContent } from '../common/featured';
import { BlockRangeAddons, BlockRangeConfig } from './block-range.config';
import { InternalBroadcastMessage } from '../internal-broadcast/internal-broadcast.message';
import { startBlockRangeBroadcastClient } from './block-range.broadcast';
import {
  blockRangeDefaultModeTaskPath,
  blockRangeReplayModeTaskPath,
} from './block-range.consts';
import { BlockRangeBroadcastMessages } from '../internal-broadcast/messages/block-range-broadcast.messages';
import { BlockRangeTaskData } from '../common/common.types';
import { Abis, setupAbis } from '../common/abis';
import { createWorkerPool } from '../common/workers/worker-pool/worker-pool.utils';
import { logTaskInfo } from './block-range.utils';
import { WorkerMessage, WorkerPool } from '../common/workers';
import { BlockRangeSchedule } from './block-range.schedule';

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
    workers: { threadsCount },
    mode,
    mongo,
  } = config;
  const featured = new FeaturedContractContent(config.featured, addons.matchers);
  const workerPool = await createWorkerPool({
    threadsCount,
    sharedData: { config, featured: featured.toJson() },
    workerLoaderPath: `${__dirname}/block-range.worker-loader`,
  });
  workerPool.onWorkerRelease(() =>
    scanNextBlockRange(abis, workerPool, scanner, schedule)
  );
  const scanner = await setupBlockRangeScanner(mongo, config.scanner);
  const abis = await setupAbis(config.mongo, config.abis, config.featured);
  const broadcast = await startBlockRangeBroadcastClient(config.broadcast);
  const schedule = new BlockRangeSchedule(config.scanKey);

  let isIdle = true;

  broadcast.onMessage(
    InternalBroadcastChannel.Processor,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (message: InternalBroadcastMessage) => {
      //
    }
  );

  // If the following options are given, the process will continue replay mode
  // "standalone" mode - regardless of whether the filler is running or not
  // The interval will persist in case of new block range
  if (schedule.scanKey && mode === Mode.Replay) {
    log(`Block Range started in "standalone" replay mode`);
    scanNextBlockRange(abis, workerPool, scanner, schedule);
  } else {
    // Runs the process in "listening mode" for tasks sent from the filler
    log(`Block Range started in "listening" mode`);
    broadcast.onMessage(
      InternalBroadcastChannel.BlockRange,
      async (message: InternalBroadcastMessage<BlockRangeTaskData>) => {
        const {
          content: { data, name },
        } = message;
        if (name === InternalBroadcastMessageName.BlockRangeTask) {
          logTaskInfo(message);
          if (isIdle && data.mode === Mode.Replay) {
            schedule.scanKey = data.scanKey;
            // start replay mode
            scanNextBlockRange(abis, workerPool, scanner, schedule);
            isIdle = false;
          } else if (isIdle && data.mode === Mode.Default) {
            // start default mode
            const worker = await workerPool.getWorker(blockRangeDefaultModeTaskPath);
            worker.onError(error => {
              log(error.message);
            });
            worker.run(data);
            isIdle = false;
          } else {
            log(
              `Task received from the filler but it will be skipped because the process is already active.`
            );
          }
        }
      }
    );
    // Everything is ready, notify the filler that the process is ready to work
    broadcast.sendMessage(BlockRangeBroadcastMessages.createBlockRangeReadyMessage());
  }

  log(`Block Range ... [ready]`);
};

export const scanNextBlockRange = async (
  abis: Abis,
  workerPool: WorkerPool,
  scanner: BlockRangeScanner,
  schedule: BlockRangeSchedule
) => {
  if (await scanner.hasUnscannedBlocks(schedule.scanKey)) {
    while (
      workerPool.hasAvailableWorker() &&
      (await scanner.hasUnscannedBlocks(schedule.scanKey))
    ) {
      const scan = await scanner.getNextScanNode(schedule.scanKey);

      if (scan && schedule.has(scan.hash) === false) {
        const { start, end, hash } = scan;
        await abis.getAbis(start, end, null, true);
        const worker = await workerPool.getWorker(blockRangeReplayModeTaskPath);
        log(
          `  -  Block Range thread #${
            worker.id
          } reads ${start.toString()}:${end.toString()} [starting]`
        );
        worker.onMessage(async (message: WorkerMessage<BlockRangeTaskData>) => {
          log(
            `  -  Block Range thread #${
              worker.id
            } reads ${start.toString()}:${end.toString()} [${
              message.isTaskResolved() ? 'task resolved' : 'task rejected'
            }]`
          );
          // release the worker and remove scan hash from the schedule
          schedule.removeByWorkerId(message.workerId);
          workerPool.releaseWorker(message.workerId);
        });
        worker.onError(error => {
          log(error);
          // release the worker in case of an error and remove scan hash from the schedule
          schedule.removeByWorkerId(worker.id);
          workerPool.releaseWorker(worker.id);
        });

        // Add the task to the schedule and start the worker
        schedule.add(worker.id, hash);
        worker.run<BlockRangeTaskData>({
          startBlock: start,
          endBlock: end,
          mode: Mode.Replay,
          scanKey: schedule.scanKey,
        });
      }
    }
  } else {
    log(`No more block ranges to scan. Well done!`);
  }
};
