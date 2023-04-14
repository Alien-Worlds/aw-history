import { BlockRangeTaskData } from './../common/common.types';
import {
  ReaderBroadcastMessage,
  ReaderBroadcastMessageData,
} from './../internal-broadcast/messages/reader-broadcast.message';
import {
  createDefaultModeBlockRange,
  createReplayModeBlockRange,
  createTestModeBlockRange,
} from './bootstrap.utils';
import { Broadcast, log, MongoSource } from '@alien-worlds/api-core';
import { setupAbis } from '../common/abis/abis.utils';
import { setupBlockRangeScanner } from '../common/block-range-scanner';
import { setupBlockState } from '../common/block-state';
import { BootstrapConfig } from './bootstrap.config';
import { NoAbisError } from './bootstrap.errors';
import {
  InternalBroadcastChannel,
  InternalBroadcastClientName,
  InternalBroadcastMessageName,
} from '../internal-broadcast/internal-broadcast.enums';
import { setupContractReader } from '../common/blockchain';
import { FeaturedContractContent } from '../common/featured';
import { Mode } from '../common/common.enums';
import { InternalBroadcastMessage } from '../internal-broadcast';

/**
 *
 * @param broadcastMessageMapper
 * @param config
 * @returns
 */
export const startBootstrap = async (config: BootstrapConfig) => {
  const { mode } = config;
  log(`Bootstrap "${mode}" mode ... [starting]`);

  const broadcast = await Broadcast.createClient({
    ...config.broadcast,
    clientName: InternalBroadcastClientName.Bootstrap,
  });
  const mongo = await MongoSource.create(config.mongo);
  const contractReader = await setupContractReader(config.contractReader, mongo);
  const abis = await setupAbis(mongo, config.abis, config.featured);
  const scanner = await setupBlockRangeScanner(mongo, config.scanner);
  const featured = new FeaturedContractContent(config.featured);
  const blockState = await setupBlockState(mongo);
  let blockRange: ReaderBroadcastMessageData;

  // fetch latest abis to make sure that the blockchain data will be correctly deserialized
  log(` * Fetch featured contracts details ... [starting]`);
  await contractReader.readContracts(featured.listContracts());
  log(` * Fetch featured contracts details ... [done]`);

  // fetch latest abis to make sure that the blockchain data will be correctly deserialized
  log(` * Fetch abis ... [starting]`);
  const abisCount = (await abis.fetchAbis()).length;
  log(` * Fetch abis ... [done]`);

  if (abisCount === 0) {
    throw new NoAbisError();
  }

  if (config.mode === Mode.Replay) {
    blockRange = await createReplayModeBlockRange(scanner, config);
  }

  broadcast.onMessage(
    InternalBroadcastChannel.Bootstrap,
    async (message: InternalBroadcastMessage) => {
      if (message.content.name === InternalBroadcastMessageName.DefaultModeReaderReady) {
        if (config.mode === Mode.Default) {
          blockRange = await createDefaultModeBlockRange(blockState, config);
          broadcast.sendMessage(ReaderBroadcastMessage.newDefaultModeTask(blockRange));
        }

        if (config.mode === Mode.Test) {
          blockRange = await createTestModeBlockRange(config);
          broadcast.sendMessage(ReaderBroadcastMessage.newDefaultModeTask(blockRange));
        }
      } else if (
        message.content.name === InternalBroadcastMessageName.ReplayModeReaderReady
      ) {
        broadcast.sendMessage(ReaderBroadcastMessage.newReplayModeTask(blockRange));
      } else {
        //
      }
    }
  );

  log(`Bootstrap ${mode} mode ... [ready]`);
};
