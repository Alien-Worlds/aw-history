import {
  BroadcastAmqClient,
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
    return this.client.onMessage(this.channel, handler);
  }
}

export const createBlockRangeBroadcastOptions = (
  mapper?: BroadcastMessageContentMapper
) => {
  return {
    prefetch: 1,
    queues: [
      {
        name: 'block_range',
        options: { durable: true },
        mapper: mapper || new BlockRangeBroadcastMapper(),
        fireAndForget: true,
      },
    ],
  };
};

export const setupBlockRangeBroadcast = async (
  url: string,
  mapper?: BroadcastMessageContentMapper
) => {
  const options = createBlockRangeBroadcastOptions(mapper);
  const client = await setupBroadcast(url, options);

  return new BlockRangeBroadcast(client, 'block_range');
};
