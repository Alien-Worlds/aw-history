import { BlockRangeInterval } from './block-range.interval';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from './../internal-broadcast/internal-broadcast.enums';
import { log } from '@alien-worlds/api-core';
import { setupBlockRangeScanner } from '../common/block-range-scanner';
import { Mode } from '../common/common.enums';
import { FeaturedContractContent } from '../common/featured';
import { WorkerPool } from '../common/workers/worker-pool';
import { BlockRangeAddons, BlockRangeConfig } from './block-range.config';
import { InternalBroadcastMessage } from '../internal-broadcast/internal-broadcast.message';
import { startBlockRangeBroadcastClient } from './block-range.broadcast';
import { blockRangeDefaultModeTaskPath } from './block-range.consts';
import { BlockRangeBroadcastMessages } from '../internal-broadcast/messages/block-range-broadcast.messages';
import { BlockRangeTaskData } from '../common/common.types';
import { setupAbis } from '../common/abis';

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
  const intervalDelay = config.intervalDelay || 1000;
  const featured = new FeaturedContractContent(config.featured, addons.matchers);
  const workerPool = new WorkerPool({
    threadsCount,
    sharedData: { config, featured: featured.toJson() },
  });
  const scanner = await setupBlockRangeScanner(mongo, config.scanner);
  const abis = await setupAbis(config.mongo, config.abis, config.featured);
  const broadcast = await startBlockRangeBroadcastClient(config.broadcast);
  const blockRangeInterval: BlockRangeInterval = new BlockRangeInterval(
    workerPool,
    scanner,
    abis
  );
  broadcast.onMessage(
    InternalBroadcastChannel.Processor,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (message: InternalBroadcastMessage) => {
      //
    }
  );

  // If the following options are given, the process will continue replay mode
  // "standalone" mode - regardless of whether the filler is running or not
  if (scanKey && mode === Mode.Replay) {
    log(`Block Range started in "standalone" replay mode`);
    blockRangeInterval.start(scanKey, intervalDelay);
  } else {
    // Runs the process in "listening mode" for tasks sent from the filler
    log(`Block Range started in "listening" mode`);
    broadcast.onMessage(
      InternalBroadcastChannel.BlockRange,
      async (message: InternalBroadcastMessage<BlockRangeTaskData>) => {
        if (message.content.name === InternalBroadcastMessageName.BlockRangeTask) {
          logTaskInfo(message);
          if (message.content.data.mode === Mode.Replay) {
            blockRangeInterval.start(message.content.data.scanKey, intervalDelay);
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

export const logTaskInfo = (message: InternalBroadcastMessage<BlockRangeTaskData>) => {
  const {
    content: {
      data: { mode, startBlock, endBlock, scanKey },
    },
  } = message;
  const info: {
    mode?: string;
    startBlock: string;
    endBlock: string;
    scanKey?: string;
  } = {
    mode,
    startBlock: startBlock.toString(),
    endBlock: endBlock.toString(),
  };
  if (mode === Mode.Replay) {
    info.scanKey = scanKey;
  }
  log(`Received block range task ${JSON.stringify(info)}`);
};
