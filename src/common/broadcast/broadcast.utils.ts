import { BroadcastAmqClient } from './amq/broadcast.amq.client';
import { Broadcast, BroadcastOptions } from './broadcast.types';

/**
 * Suspends execution of the current process for a given number of milliseconds
 * @async
 * @param {number} ms
 * @returns {Promise}
 */
export const wait = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 *
 * @param {ProcessorConfig} config
 * @param {BroadcastMessageMapper} broadcastMessageMapper
 * @returns { Broadcast }
 */
export const setupBroadcast = async <BroadcastType = Broadcast>(
  url: string,
  options: BroadcastOptions
): Promise<BroadcastType> => {
  const broadcastClient = new BroadcastAmqClient(url, options, console);

  await broadcastClient.init();

  return broadcastClient as BroadcastType;
};
