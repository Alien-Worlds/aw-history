import { log } from '@alien-worlds/api-core';
import { setupAbis } from '../common/abis/abis.utils';
import { setupBlockRangeScanner } from '../common/block-range-scanner';
import { setupBlockState } from '../common/block-state';
import { Mode } from '../common/common.enums';
import { UnknownModeError } from '../common/common.errors';
import { FillerConfig } from './filler.config';
import { NoAbisError } from './filler.errors';
import {
  InternalBroadcastChannel,
  InternalBroadcastClientName,
  InternalBroadcastMessageName,
} from '../internal-broadcast/internal-broadcast.enums';
import { InternalBroadcastMessage } from '../internal-broadcast/internal-broadcast.message';
import { startBroadcastClient } from '../common/broadcast/start-broadcast-client';
import {
  prepareDefaultModeInput,
  prepareReplayModeInput,
  prepareTestModeInput,
} from './filler.utils';
import { BlockRangeBroadcastMessages } from '../internal-broadcast/messages/block-range-broadcast.messages';
import { BlockRangeTaskData } from '../common/common.types';

/**
 *
 * @param broadcastMessageMapper
 * @param config
 * @returns
 */
export const startFiller = async (config: FillerConfig) => {
  const { mode } = config;

  log(`Filler "${mode}" mode ... [starting]`);

  const broadcast = await startBroadcastClient(
    InternalBroadcastClientName.Filler,
    config.broadcast
  );
  const abis = await setupAbis(config.mongo, config.abis, config.featured);
  const blockState = await setupBlockState(config.mongo);
  const scanner = await setupBlockRangeScanner(config.mongo, config.scanner);

  let blockRangeTaskInput: BlockRangeTaskData;

  // fetch latest abis to make sure that the blockchain data will be correctly deserialized
  log(` * Fetch abis ... [starting]`);
  const abisCount = (await abis.fetchAbis()).length;
  log(` * Fetch abis ... [ready]`);

  if (abisCount === 0) {
    throw new NoAbisError();
  }

  if (mode === Mode.Default) {
    blockRangeTaskInput = await prepareDefaultModeInput(blockState, config);
  } else if (mode === Mode.Replay) {
    //
    blockRangeTaskInput = await prepareReplayModeInput(scanner, config);
  } else if (mode === Mode.Test) {
    //
    blockRangeTaskInput = await prepareTestModeInput(config);
  } else {
    //
    throw new UnknownModeError(mode);
  }

  try {
    broadcast.onMessage(
      InternalBroadcastChannel.BlockRange,
      async (message: InternalBroadcastMessage) => {
        if (message.content.name === InternalBroadcastMessageName.BlockRangeReady) {
          broadcast.sendMessage(
            BlockRangeBroadcastMessages.createBlockRangeTaskMessage(blockRangeTaskInput)
          );
        }
      }
    );
  } catch (error) {
    log(error);
  }

  log(`Filler ${mode} mode ... [ready]`);
};
