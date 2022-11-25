import { log } from '@alien-worlds/api-core';
import {
  BroadcastAmqClient,
  BroadcastConfig,
  BroadcastMessage,
  BroadcastMessageContentMapper,
  MessageHandler,
  setupBroadcast,
} from '../../common/broadcast';
import { BlockRangeBroadcastMapper } from './block-range.mapper';
import { BlockRangeMessageContent } from './block-range.message-content';

const taskQueueName = 'block_range_task';
const readyQueueName = 'block_range_process_ready';

export abstract class BlockRangeBroadcastEmmiter {
  public abstract sendMessage(data: BlockRangeMessageContent): Promise<void>;
}

export class BlockRangeBroadcast implements BlockRangeBroadcastEmmiter {
  constructor(private client: BroadcastAmqClient) {}

  public sendMessage(data: BlockRangeMessageContent): Promise<void> {
    return this.client.sendMessage(taskQueueName, data);
  }

  public sendProcessReadyMessage(): Promise<void> {
    return this.client.sendMessage(readyQueueName);
  }

  public onMessage(
    handler: MessageHandler<BroadcastMessage<BlockRangeMessageContent>>
  ): void {
    this.client.onMessage(taskQueueName, handler).catch(log);
  }

  public onBlockRangeReadyMessage(handler: MessageHandler<BroadcastMessage>): void {
    this.client.onMessage(readyQueueName, handler).catch(log);
  }
}

export const createBlockRangeBroadcastOptions = (
  config: BroadcastConfig,
  mapper?: BroadcastMessageContentMapper
) => {
  return {
    prefetch: 1,
    queues: [
      {
        name: taskQueueName,
        options: { durable: true },
        mapper: mapper || new BlockRangeBroadcastMapper(),
        fireAndForget: true,
      },
      {
        name: readyQueueName,
        options: { durable: true },
        fireAndForget: false,
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
  return new BlockRangeBroadcast(client);
};
