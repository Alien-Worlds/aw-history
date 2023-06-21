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
  InternalBroadcastMessageName,
} from '../broadcast/internal-broadcast.enums';
import { Mode } from '../common/common.enums';
import { ConfigVars, UnknownObject, log } from '@alien-worlds/api-core';
import { BroadcastMessage } from '@alien-worlds/broadcast';
import { buildBootstrapConfig } from '../config';
import { bootstrapCommand } from './bootstrap.command';
import { FeaturedUtils } from '../common/featured/featured.utils';
import { BootstrapDependencies } from './bootstrap.dependencies';

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
export const bootstrap = async (
  config: BootstrapConfig,
  dependencies: BootstrapDependencies,
  featuredJson: UnknownObject
): Promise<void> => {
  const { mode } = config;
  log(`Bootstrap "${mode}" mode ... [starting]`);
  const featuredContracts = FeaturedUtils.readFeaturedContracts(featuredJson);

  await dependencies.initialize(config, featuredContracts);

  const { abis, broadcastClient, blockState, blockchain, featured, scanner } =
    dependencies;
  let blockRange: ReaderBroadcastMessageData;

  // fetch latest abis to make sure that the blockchain data will be correctly deserialized
  log(` * Fetch featured contracts details ... [starting]`);
  await featured.readContracts(featuredContracts);
  log(` * Fetch featured contracts details ... [done]`);

  // fetch latest abis to make sure that the blockchain data will be correctly deserialized
  log(` * Fetch abis ... [starting]`);
  const { content: fetchedAbis, failure: fetchAbisFailure } = await abis.fetchAbis();

  if (fetchAbisFailure) {
    throw fetchAbisFailure.error;
  }

  const abisCount = fetchedAbis.length;
  log(` * Fetch abis ... [done]`);

  if (abisCount === 0) {
    throw new NoAbisError();
  }

  if (config.mode === Mode.Replay) {
    blockRange = await createReplayModeBlockRange(scanner, blockchain, config);
  }

  broadcastClient.onMessage(
    InternalBroadcastChannel.Bootstrap,
    async (message: BroadcastMessage) => {
      if (message.name === InternalBroadcastMessageName.DefaultModeReaderReady) {
        if (config.mode === Mode.Default) {
          blockRange = await createDefaultModeBlockRange(blockState, blockchain, config);
          broadcastClient.sendMessage(
            ReaderBroadcastMessage.newDefaultModeTask(blockRange)
          );
        }

        if (config.mode === Mode.Test) {
          blockRange = await createTestModeBlockRange(blockchain, config);
          broadcastClient.sendMessage(
            ReaderBroadcastMessage.newDefaultModeTask(blockRange)
          );
        }
      } else if (message.name === InternalBroadcastMessageName.ReplayModeReaderReady) {
        broadcastClient.sendMessage(ReaderBroadcastMessage.newReplayModeTask(blockRange));
      } else {
        //
      }
    }
  );

  broadcastClient.connect();

  log(`Bootstrap ${mode} mode ... [ready]`);
};

/**
 * startBootstrap is a function that takes command line options to build a bootstrap configuration
 * and then initiate the bootstrap process. It throws an error if the bootstrap process fails.
 *
 * @param {string[]} args The command line args for bootstrap.
 * @param {BootstrapDependencies} dependencies The bootstrap process dependencies.
 * @param {UnknownObject} featuredJson
 */
export const startBootstrap = (
  args: string[],
  dependencies: BootstrapDependencies,
  featuredJson: UnknownObject
) => {
  const vars = new ConfigVars();
  const options = bootstrapCommand.parse(args).opts<BootstrapCommandOptions>();
  const config = buildBootstrapConfig(vars, options);
  bootstrap(config, dependencies, featuredJson).catch(log);
};
