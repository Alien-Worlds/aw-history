import { Broadcast, log } from '@alien-worlds/api-core';
import { ProcessorAddons, ProcessorConfig } from './processor.types';
import {
  InternalBroadcastChannel,
  InternalBroadcastClientName,
  InternalBroadcastMessageName,
  ProcessorBroadcastMessage,
} from '../internal-broadcast';
import { InternalBroadcastMessage } from '../internal-broadcast/internal-broadcast.message';
import { ProcessorRunner } from './processor.runner';

/**
 *
 * @param featuredContent
 * @param broadcastMessageMapper
 * @param config
 */
export const startProcessor = async (
  config: ProcessorConfig,
  addons: ProcessorAddons = {}
) => {
  log(`Processor ... [starting]`);
  const broadcast = await Broadcast.createClient({
    ...config.broadcast,
    clientName: InternalBroadcastClientName.Processor,
  });
  const runner = await ProcessorRunner.getInstance(config, addons);

  broadcast.onMessage(
    InternalBroadcastChannel.Processor,
    async (message: InternalBroadcastMessage) => {
      if (
        message.content.name === InternalBroadcastMessageName.ProcessorTasksQueueUpdate
      ) {
        runner.next();
      }
    }
  );
  await broadcast.connect();
  // Everything is ready, notify the block-range that the process is ready to work
  broadcast.sendMessage(ProcessorBroadcastMessage.ready());

  // start processor in case the queue already contains tasks
  runner.next();

  log(`Processor ... [ready]`);
};
