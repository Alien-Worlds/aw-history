import { Broadcast, log, MongoSource } from '@alien-worlds/api-core';
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
import {
  prepareDefaultModeInput,
  prepareReplayModeInput,
  prepareTestModeInput,
} from './filler.utils';
import { BlockRangeBroadcastMessages } from '../internal-broadcast/messages/block-range-broadcast.messages';
import { BlockRangeTaskData } from '../common/common.types';
import { setupContractReader } from '../common/blockchain';
import { FeaturedContractContent } from '../common/featured';

/**
 *
 * @param broadcastMessageMapper
 * @param config
 * @returns
 */
export const startFiller = async (config: FillerConfig) => {
  const { mode } = config;

  log(`Filler "${mode}" mode ... [starting]`);

  const broadcast = await Broadcast.createClient({
    ...config.broadcast,
    clientName: InternalBroadcastClientName.Filler,
  });
  const mongo = await MongoSource.create(config.mongo);
  const contractReader = await setupContractReader(config.contractReader, mongo);
  const abis = await setupAbis(mongo, config.abis, config.featured);
  const blockState = await setupBlockState(mongo);
  const scanner = await setupBlockRangeScanner(mongo, config.scanner);
  const featured = new FeaturedContractContent(config.featured);

  let blockRangeTaskInput: BlockRangeTaskData;

  // fetch latest abis to make sure that the blockchain data will be correctly deserialized
  log(` * Fetch featured contracts details ... [starting]`);
  await contractReader.readContracts(featured.listContracts());
  log(` * Fetch featured contracts details ... [ready]`);

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
    // Listen for block-range messages
    broadcast.onMessage(
      InternalBroadcastChannel.BlockRange,
      async (message: InternalBroadcastMessage) => {
        // In the case of further block-range processes (e.g. after a process reset or creating additional ones),
        // send a task to all block-range processes.
        if (message.content.name === InternalBroadcastMessageName.BlockRangeReady) {
          broadcast.sendMessage(
            BlockRangeBroadcastMessages.createBlockRangeTaskMessage(blockRangeTaskInput)
          );
        }
      }
    );
    await broadcast.connect();
    // Everything is ready, send a task to block-range processes
    broadcast.sendMessage(
      BlockRangeBroadcastMessages.createBlockRangeTaskMessage(blockRangeTaskInput)
    );
  } catch (error) {
    log(error);
  }

  log(`Filler ${mode} mode ... [ready]`);
};
