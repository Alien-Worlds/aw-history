/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../broadcast/internal-broadcast.enums';
import { ConfigVars, log } from '@alien-worlds/api-core';
import { ReadTaskData, ReaderCommandOptions, ReaderConfig } from './reader.types';
import { ReaderBroadcastMessage } from '../broadcast/messages/reader-broadcast.message';
import { Reader } from './reader';
import { Mode } from '../common';
import { readerCommand } from './reader.command';
import { ReaderDependencies } from './reader.dependencies';
import { buildReaderConfig } from '../config';
import { BroadcastMessage } from '@alien-worlds/broadcast';

/**
 *
 * @param config
 * @returns
 */
export const read = async (config: ReaderConfig, dependencies: ReaderDependencies) => {
  log(`Reader ... [starting]`);

  const initResult = await dependencies.initialize(config);

  if (initResult.isFailure) {
    throw initResult.failure.error;
  }

  const { broadcastClient, scanner, workerPool } = dependencies;
  const reader = new Reader(broadcastClient, scanner, workerPool);

  let channel: string;
  let readyMessage;

  if (config.mode === Mode.Replay) {
    channel = InternalBroadcastChannel.ReplayModeReader;
    readyMessage = ReaderBroadcastMessage.replayModeReady();
  } else {
    channel = InternalBroadcastChannel.DefaultModeReader;
    readyMessage = ReaderBroadcastMessage.defaultModeReady();
  }

  log(`Reader started in "listening" mode`);
  broadcastClient.onMessage(channel, async (message: BroadcastMessage<ReadTaskData>) => {
    const { data, name } = message;
    if (name === InternalBroadcastMessageName.ReaderTask) {
      reader.read(data);
    }
  });
  broadcastClient.connect();
  // Everything is ready, notify the bootstrap that the process is ready to work
  broadcastClient.sendMessage(readyMessage);

  log(`Reader ... [ready]`);
};

export const startReader = (args: string[], dependencies: ReaderDependencies) => {
  const vars = new ConfigVars();
  const options = readerCommand.parse(args).opts<ReaderCommandOptions>();
  const config = buildReaderConfig(vars, options);
  read(config, dependencies).catch(log);
};
