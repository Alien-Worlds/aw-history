import { ReaderCommandOptions } from './reader.types';
import { readerCommand } from './reader.command';
import { buildReaderConfig } from '../config';
import { log, ConfigVars } from '@alien-worlds/aw-core';
import { Mode, UnknownModeError } from '../common';
import { ReaderDependencies } from './reader.dependencies';
import { readBlocksInDefaultMode } from './read-blocks-in-default-mode';
import { readBlocksInReplayMode } from './read-blocks-in-replay-mode';

/**
 * Initiates the reader based on provided arguments and dependencies. This function parses the provided arguments,
 * builds the reader's configuration, and initializes the reading mode (Replay or Default).
 * 
 * @param {string[]} args - Arguments that specify command options for the reader.
 * @param {ReaderDependencies} dependencies - External dependencies required by the reader.
 * 
 * @returns {Promise<void>} Returns a promise which resolves when the reader has been successfully started or rejects
 * with an error if an issue is encountered during initialization or an unknown mode is detected.
 * 
 * @throws {UnknownModeError} Throws an error if the mode specified in the configuration is neither Replay nor Default.
 */
export const startReader = async (args: string[], dependencies: ReaderDependencies) => {
  log(`Reader ... [starting]`);
  const vars = new ConfigVars();
  const options = readerCommand.parse(args).opts<ReaderCommandOptions>();
  const config = buildReaderConfig(vars, dependencies.databaseConfigBuilder, options);

  const initResult = await dependencies.initialize(config);

  if (initResult.isFailure) {
    throw initResult.failure.error;
  }

  if (config.mode === Mode.Replay) {
    return readBlocksInReplayMode(config, dependencies);
  }

  if (config.mode === Mode.Default) {
    return readBlocksInDefaultMode(config, dependencies);
  }

  throw new UnknownModeError(config.mode, [Mode.Default, Mode.Replay]);
};
