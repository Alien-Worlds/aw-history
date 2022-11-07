import {
  BroadcastAmqClient,
  BroadcastMessage,
  BroadcastMessageContentMapper,
} from '../common/broadcast';
import { BlockRangeBroadcastMapper } from './block-range.mapper';
import { BlockRangeTaskInput } from './block-range.task-input';

export abstract class BlockRangeBroadcastEmmiter {
  public abstract sendMessage(data: BlockRangeTaskInput): Promise<void>;
}

export class BlockRangeBroadcast implements BlockRangeBroadcastEmmiter {
  constructor(private client: BroadcastAmqClient, private channel: string) {}

  public sendMessage(data: BlockRangeTaskInput): Promise<void> {
    return this.client.sendMessage(this.channel, data);
  }

  public onMessage(
    handler: (message: BroadcastMessage<BlockRangeTaskInput>) => void
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
        options: { durable: false },
        mapper: mapper || new BlockRangeBroadcastMapper(),
        noAck: true,
      },
    ],
  };
};
