import { log } from '@alien-worlds/api-core';
import { ProcessorAddons, ProcessorConfig } from './processor.config';
import { startProcessorBroadcastClient } from './processor.broadcast';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
  ProcessorBroadcastMessages,
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
  const broadcast = await startProcessorBroadcastClient(config.broadcast);
  const runner = await ProcessorRunner.getInstance(config, addons);

  broadcast.onMessage(
    InternalBroadcastChannel.Processor,
    async (message: InternalBroadcastMessage) => {
      if (
        message.content.name === InternalBroadcastMessageName.ProcessorTasksQueueUpdate
      ) {
        runner.next(true);
      }
    }
  );

  // Everything is ready, notify the block-range that the process is ready to work
  broadcast.sendMessage(ProcessorBroadcastMessages.createProcessorReadyMessage());

  // start processor in case the queue already contains tasks
  runner.next();

  log(`Processor ... [ready]`);
};
