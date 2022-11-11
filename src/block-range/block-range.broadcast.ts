import { log } from '@alien-worlds/api-core';
import {
  BroadcastAmqClient,
  BroadcastConfig,
  BroadcastMessage,
  BroadcastMessageContentMapper,
  MessageHandler,
  setupBroadcast,
} from '../common/broadcast';
import { BlockRangeBroadcastMapper } from './block-range.mapper';
import { BlockRangeMessageContent } from './block-range.message-content';

export abstract class BlockRangeBroadcastEmmiter {
  public abstract sendMessage(data: BlockRangeMessageContent): Promise<void>;
}

export class BlockRangeBroadcast implements BlockRangeBroadcastEmmiter {
  constructor(private client: BroadcastAmqClient, private channel: string) {}

  public sendMessage(data: BlockRangeMessageContent): Promise<void> {
    return this.client.sendMessage(this.channel, data);
  }

  public onMessage(
    handler: MessageHandler<BroadcastMessage<BlockRangeMessageContent>>
  ): void {
    this.client.onMessage(this.channel, handler).catch(log);
  }
}

export const createBlockRangeBroadcastOptions = (
  config: BroadcastConfig,
  mapper?: BroadcastMessageContentMapper
) => {
  const { fireAndForget, name } = config;
  return {
    prefetch: 1,
    queues: [
      {
        name: name || 'block_range',
        options: { durable: true },
        mapper: mapper || new BlockRangeBroadcastMapper(),
        fireAndForget: fireAndForget || true,
      },
    ],
  };
};

export const setupBlockRangeBroadcast = async (
  config: BroadcastConfig,
  mapper?: BroadcastMessageContentMapper
) => {
  log(` *  Block Range Broadcast ... [starting]`);
  const { url } = config;
  const options = createBlockRangeBroadcastOptions(config, mapper);
  const client = await setupBroadcast(url, options);
  client.onMessageSent(() => {
    log(`      >  Message sent.`);
  });
  log(` *  Block Range Broadcast ... [ready]`);
  return new BlockRangeBroadcast(client, 'block_range');
};
