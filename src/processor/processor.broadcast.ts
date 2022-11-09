import {
  BroadcastAmqClient,
  BroadcastMessage,
  BroadcastMessageContentMapper,
  BroadcastOptions,
  MessageHandler,
  setupBroadcast,
} from '../common/broadcast';
import { TraceProcessorBroadcastMapper } from './tasks/trace-processor.mapper';
import { DeltaProcessorBroadcastMapper } from './tasks/delta-processor.mapper';
import { DeltaProcessorMessageContent } from './tasks/delta-processor.message-content';
import { TraceProcessorMessageContent } from './tasks/trace-processor.message-content';

export abstract class ProcessorBroadcastEmmiter {
  public abstract sendTraceMessage(data: TraceProcessorMessageContent): Promise<void>;
  public abstract sendDeltaMessage(data: DeltaProcessorMessageContent): Promise<void>;
}

const traceQueueName = 'trace_processor';
const deltaQueueName = 'delta_processor';

export class ProcessorBroadcast implements ProcessorBroadcastEmmiter {
  constructor(private client: BroadcastAmqClient) {}

  public sendTraceMessage(data: TraceProcessorMessageContent): Promise<void> {
    return this.client.sendMessage(traceQueueName, data);
  }

  public sendDeltaMessage(data: DeltaProcessorMessageContent): Promise<void> {
    return this.client.sendMessage(deltaQueueName, data);
  }

  public onTraceMessage(
    handler: MessageHandler<BroadcastMessage<TraceProcessorMessageContent>>
  ): void {
    return this.client.onMessage(traceQueueName, handler);
  }

  public onDeltaMessage(
    handler: MessageHandler<BroadcastMessage<DeltaProcessorMessageContent>>
  ): void {
    return this.client.onMessage(deltaQueueName, handler);
  }
}

export const createProcessorBroadcastOptions = (
  traceProcessorMapper?: BroadcastMessageContentMapper,
  deltaProcessorMapper?: BroadcastMessageContentMapper
): BroadcastOptions => {
  return {
    prefetch: 1,
    queues: [
      {
        name: traceQueueName,
        options: { durable: true },
        mapper: traceProcessorMapper || new TraceProcessorBroadcastMapper(),
        fireAndForget: false,
      },
      {
        name: deltaQueueName,
        options: { durable: true },
        mapper: deltaProcessorMapper || new DeltaProcessorBroadcastMapper(),
        fireAndForget: false,
      },
    ],
  };
};

export const setupProcessorBroadcast = async (
  url: string,
  traceProcessorMapper?: BroadcastMessageContentMapper<TraceProcessorMessageContent>,
  deltaProcessorMapper?: BroadcastMessageContentMapper<DeltaProcessorMessageContent>
) => {
  const options = createProcessorBroadcastOptions(
    traceProcessorMapper,
    deltaProcessorMapper
  );
  const client = await setupBroadcast(url, options);

  return new ProcessorBroadcast(client);
};
