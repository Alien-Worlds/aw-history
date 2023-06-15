import {
  ReaderBroadcastMessage,
  ReaderBroadcastMessageData,
} from '../broadcast/messages/reader-broadcast.message';
import {
  createDefaultModeBlockRange,
  createReplayModeBlockRange,
  createTestModeBlockRange,
} from './bootstrap.utils';
import { BootstrapCommandOptions, BootstrapConfig } from './bootstrap.types';
import { NoAbisError } from './bootstrap.errors';
import {
  InternalBroadcastChannel,
  InternalBroadcastClientName,
  InternalBroadcastMessageName,
} from '../broadcast/internal-broadcast.enums';
import { FeaturedConfig, FeaturedContractContent } from '../common/featured';
import { Mode } from '../common/common.enums';
import { Abis, BlockRangeScanner, BlockState, ContractReader } from '../common';
import { MongoSource } from '@alien-worlds/storage-mongodb';
import { ConfigVars, log } from '@alien-worlds/api-core';
import { BroadcastMessage, BroadcastTcpClient } from '@alien-worlds/broadcast';
import { buildBootstrapConfig } from '../config';
import { bootstrapCommand } from './bootstrap.command';

/**
 * The bootstrap function initiates the bootstrap process based on the configuration provided.
 * Depending on the mode of operation (default, replay, or test), it prepares the necessary 
 * resources such as a broadcast client, mongo source, contract reader, ABI data, scanner, 
 * featured contract details, and block state.
 * It also sets up a message handler for the bootstrap broadcast channel to handle various 
 * messages related to the reader readiness in different modes.
 *
 * @param {BootstrapConfig} config The bootstrap configuration object.
 * @throws {NoAbisError} When no ABIs are fetched.
 * 
 * @returns {Promise<void>} The Promise that resolves when the bootstrap process has been initiated successfully.
 */
export const bootstrap = async (config: BootstrapConfig) => {
  const { mode } = config;
  log(`Bootstrap "${mode}" mode ... [starting]`);

  const broadcast = await new BroadcastTcpClient(
    config.broadcast,
    InternalBroadcastClientName.Bootstrap
  );
  const mongo = await MongoSource.create(config.mongo);
  const contractReader = await ContractReader.create(config.contractReader, mongo);
  const abis = await Abis.create(mongo, config.abis, config.featured);
  const scanner = await BlockRangeScanner.create(mongo, config.scanner);
  const featured = new FeaturedContractContent(config.featured);
  const blockState = await BlockState.create(mongo);
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
    async (message: BroadcastMessage) => {
      if (message.name === InternalBroadcastMessageName.DefaultModeReaderReady) {
        if (config.mode === Mode.Default) {
          blockRange = await createDefaultModeBlockRange(blockState, config);
          broadcast.sendMessage(ReaderBroadcastMessage.newDefaultModeTask(blockRange));
        }

        if (config.mode === Mode.Test) {
          blockRange = await createTestModeBlockRange(config);
          broadcast.sendMessage(ReaderBroadcastMessage.newDefaultModeTask(blockRange));
        }
      } else if (message.name === InternalBroadcastMessageName.ReplayModeReaderReady) {
        broadcast.sendMessage(ReaderBroadcastMessage.newReplayModeTask(blockRange));
      } else {
        //
      }
    }
  );

  broadcast.connect();

  log(`Bootstrap ${mode} mode ... [ready]`);
};

/**
 * startBootstrap is a function that takes command line options to build a bootstrap configuration 
 * and then initiate the bootstrap process. It throws an error if the bootstrap process fails.
 *
 * @param {BootstrapCommandOptions} options The command line options for bootstrap.
 * @throws {Error} When the bootstrap process fails.
 * 
 * @returns {Promise<void>} The Promise that resolves when the bootstrap process has been initiated successfully.
 */
export const startBootstrap = (args: string[], featured: FeaturedConfig) => {
  const vars = new ConfigVars();
  const options = bootstrapCommand.parse(args).opts<BootstrapCommandOptions>();
  const config = buildBootstrapConfig(vars, featured, options);

  bootstrap(config).catch(log);
};
