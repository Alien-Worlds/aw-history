import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from './../internal-broadcast/internal-broadcast.enums';
import { log } from '@alien-worlds/api-core';
import { Mode } from '../common/common.enums';
import { BlockRangeAddons, BlockRangeConfig } from './block-range.config';
import { InternalBroadcastMessage } from '../internal-broadcast/internal-broadcast.message';
import { startBlockRangeBroadcastClient } from './block-range.broadcast';
import { BlockRangeBroadcastMessages } from '../internal-broadcast/messages/block-range-broadcast.messages';
import { BlockRangeTaskData } from '../common/common.types';
import { logTaskInfo } from './block-range.utils';
import {
  BlockRangeReplayService,
  BlockRangeDefaultService,
  BlockRangeService,
} from './service';

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

  const { mode, scanKey } = config;
  const broadcast = await startBlockRangeBroadcastClient(config.broadcast);

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
  if (scanKey && mode === Mode.Replay) {
    log(`Block Range started in "standalone" replay mode`);
    (
      await BlockRangeService.getInstance<BlockRangeReplayService>(mode, config, addons)
    ).next(scanKey);
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
          //
          logTaskInfo(message);
          if (data.mode === Mode.Replay) {
            // start replay mode
            (
              await BlockRangeService.getInstance<BlockRangeReplayService>(
                data.mode,
                config,
                addons
              )
            ).next(data.scanKey);
          } else if (data.mode === Mode.Default) {
            // start default mode
            (
              await BlockRangeService.getInstance<BlockRangeDefaultService>(
                data.mode,
                config,
                addons
              )
            ).start(data);
          } else {
            log(`Unknown mode ${data.mode}.`);
          }
        }
      }
    );
    // Everything is ready, notify the filler that the process is ready to work
    broadcast.sendMessage(BlockRangeBroadcastMessages.createBlockRangeReadyMessage());
  }

  log(`Block Range ... [ready]`);
};
