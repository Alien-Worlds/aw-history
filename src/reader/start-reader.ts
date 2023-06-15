/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  InternalBroadcastChannel,
  InternalBroadcastClientName,
  InternalBroadcastMessageName,
} from '../broadcast/internal-broadcast.enums';
import { log } from '@alien-worlds/api-core';
import { ReadTaskData, ReaderConfig } from './reader.types';
import { InternalBroadcastMessage } from '../broadcast/internal-broadcast.message';
import { ReaderBroadcastMessage } from '../broadcast/messages/reader-broadcast.message';
import { Reader } from './reader';
import { Mode } from '../common';

/**
 *
 * @param config
 * @returns
 */
export const startReader = async (config: ReaderConfig) => {
  log(`Reader ... [starting]`);
  const broadcast = await Broadcast.createClient({
    ...config.broadcast,
    clientName: InternalBroadcastClientName.Reader,
  });
  const blockRangeReader = await Reader.create(config, broadcast);
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
  broadcast.onMessage(
    channel,
    async (message: InternalBroadcastMessage<ReadTaskData>) => {
      const {
        content: { data, name },
      } = message;
      if (name === InternalBroadcastMessageName.ReaderTask) {
        blockRangeReader.read(data);
      }
    }
  );
  broadcast.connect();
  // Everything is ready, notify the bootstrap that the process is ready to work
  broadcast.sendMessage(readyMessage);

  log(`Reader ... [ready]`);
};
