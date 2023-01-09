import { log } from '@alien-worlds/api-core';
import {
  BroadcastAmqClient,
  BroadcastConfig,
  BroadcastMessage,
  BroadcastMessageContentMapper,
  MessageHandler,
  setupBroadcast,
} from '../../common/broadcast';
import { BlockRangeTaskBroadcastMapper } from './block-range-task.mapper';
import { BlockRangeTaskMessageContent } from './block-range-task.message-content';

const taskQueueName = 'block_range_task';
const orchestratorQueueName = 'block_range';

export abstract class BlockRangeBroadcastEmmiter {
  public abstract sendTaskMessage(data: BlockRangeTaskMessageContent): Promise<void>;
}

export class BlockRangeBroadcast implements BlockRangeBroadcastEmmiter {
  constructor(private client: BroadcastAmqClient) {}

  public sendTaskMessage(data: BlockRangeTaskMessageContent): Promise<void> {
    return this.client.sendMessage(taskQueueName, data);
  }

  public async ack(message: BroadcastMessage): Promise<void> {
    return this.client.ack(message);
  }

  public async reject(message: BroadcastMessage): Promise<void> {
    return this.client.reject(message, false);
  }

  public async postpone(message: BroadcastMessage): Promise<void> {
    return this.client.reject(message, true);
  }

  public sendBlockRangeReadyMessage(): Promise<void> {
    return this.client.sendMessage(orchestratorQueueName);
  }

  public onTaskMessage(
    handler: MessageHandler<BroadcastMessage<BlockRangeTaskMessageContent>>
  ): void {
    this.client.onMessage(taskQueueName, handler).catch(log);
  }

  public onBlockRangeReadyMessage(handler: MessageHandler<BroadcastMessage>): void {
    this.client.onMessage(orchestratorQueueName, handler).catch(log);
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
        mapper: mapper || new BlockRangeTaskBroadcastMapper(),
        fireAndForget: true,
      },
      {
        name: orchestratorQueueName,
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
