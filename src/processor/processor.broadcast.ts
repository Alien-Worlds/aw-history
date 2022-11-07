import {
  BroadcastAmqClient,
  BroadcastMessage,
  BroadcastMessageContentMapper,
  BroadcastOptions,
} from '../common/broadcast';
import { TraceProcessorBroadcastMapper } from './tasks/trace-processor.mapper';
import { DeltaProcessorBroadcastMapper } from './tasks/delta-processor.mapper';

export abstract class ProcessorBroadcastEmmiter<TaskType> {
  public abstract sendMessage(data: TaskType): Promise<void>;
}

export class ProcessorBroadcast<TaskType = unknown>
  implements ProcessorBroadcastEmmiter<TaskType>
{
  constructor(private client: BroadcastAmqClient, private channel: string) {}

  public sendMessage(data: TaskType): Promise<void> {
    return this.client.sendMessage(this.channel, data);
  }

  public onMessage(handler: (message: BroadcastMessage<TaskType>) => void): void {
    return this.client.onMessage(this.channel, handler);
  }
}

export const createProcessorBroadcastOptions = (
  actionProcessorMapper?: BroadcastMessageContentMapper,
  deltaProcessorMapper?: BroadcastMessageContentMapper
): BroadcastOptions => {
  return {
    prefetch: 1,
    queues: [
      {
        name: 'action_processor',
        options: { durable: true },
        mapper: actionProcessorMapper || new TraceProcessorBroadcastMapper(),
        noAck: false,
      },
      {
        name: 'delta_processor',
        options: { durable: true },
        mapper: deltaProcessorMapper || new DeltaProcessorBroadcastMapper(),
        noAck: false,
      },
    ],
  };
};
