import { Broadcast, log } from '@alien-worlds/api-core';
import { FilterAddons, FilterConfig } from './filter.types';
import {
  InternalBroadcastChannel,
  InternalBroadcastClientName,
  InternalBroadcastMessageName,
} from '../broadcast';
import { InternalBroadcastMessage } from '../broadcast/internal-broadcast.message';
import { FilterRunner } from './filter.runner';
import { FilterBroadcastMessage } from '../broadcast/messages/filter-broadcast.message';

/**
 *
 * @param featuredContent
 * @param broadcastMessageMapper
 * @param config
 */
export const startFilter = async (config: FilterConfig, addons?: FilterAddons) => {
  log(`Filter ... [starting]`);
  const broadcast = await Broadcast.createClient({
    ...config.broadcast,
    clientName: InternalBroadcastClientName.Filter,
  });
  const runner = await FilterRunner.create(config, addons);

  broadcast.onMessage(
    InternalBroadcastChannel.Filter,
    async (message: InternalBroadcastMessage) => {
      if (message.content.name === InternalBroadcastMessageName.FilterUpdate) {
        runner.next();
      }
    }
  );
  await broadcast.connect();
  // Everything is ready, notify bootstrap that the process is ready to work
  broadcast.sendMessage(FilterBroadcastMessage.ready());

  // start filter in case the queue already contains blocks
  runner.next();

  log(`Filter ... [ready]`);
};
