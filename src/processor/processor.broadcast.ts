import {
  BroadcastAmqClient,
  BroadcastConfig,
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
import { log } from '@alien-worlds/api-core';

export abstract class ProcessorBroadcastEmmiter {
  public abstract sendTraceMessage(data: TraceProcessorMessageContent): Promise<void>;
  public abstract sendDeltaMessage(data: DeltaProcessorMessageContent): Promise<void>;
}

const traceQueueName = 'trace_processor';
const deltaQueueName = 'delta_processor';

export class ProcessorBroadcast implements ProcessorBroadcastEmmiter {
  constructor(private client: BroadcastAmqClient, private paused?: boolean) {}

  public sendTraceMessage(data: TraceProcessorMessageContent): Promise<void> {
    return this.client.sendMessage(traceQueueName, data);
  }

  public sendDeltaMessage(data: DeltaProcessorMessageContent): Promise<void> {
    return this.client.sendMessage(deltaQueueName, data);
  }

  public onTraceMessage(
    handler: MessageHandler<BroadcastMessage<TraceProcessorMessageContent>>
  ): void {
    this.client.onMessage(traceQueueName, handler).catch(log);
  }

  public onDeltaMessage(
    handler: MessageHandler<BroadcastMessage<DeltaProcessorMessageContent>>
  ): void {
    this.client.onMessage(deltaQueueName, handler).catch(log);
  }

  public pause(): void {
    this.client.cancel();
    this.paused = true;
  }

  public async resume(): Promise<void> {
    try {
      await this.client.resume();
      this.paused = false;
    } catch (error) {
      log(`Could not resume broadcast.`, error);
    }
  }

  public get isPaused(): boolean {
    return this.paused;
  }
}

export const createProcessorBroadcastOptions = (
  config: BroadcastConfig,
  traceProcessorMapper?: BroadcastMessageContentMapper,
  deltaProcessorMapper?: BroadcastMessageContentMapper
): BroadcastOptions => {
  const { fireAndForget } = config;
  return {
    prefetch: 0,
    queues: [
      {
        name: traceQueueName,
        options: { durable: true },
        mapper: traceProcessorMapper || new TraceProcessorBroadcastMapper(),
        fireAndForget: fireAndForget || false,
      },
      {
        name: deltaQueueName,
        options: { durable: true },
        mapper: deltaProcessorMapper || new DeltaProcessorBroadcastMapper(),
        fireAndForget: fireAndForget || false,
      },
    ],
  };
};

export const setupProcessorBroadcast = async (
  config: BroadcastConfig,
  traceProcessorMapper?: BroadcastMessageContentMapper<TraceProcessorMessageContent>,
  deltaProcessorMapper?: BroadcastMessageContentMapper<DeltaProcessorMessageContent>
) => {
  log(` *  Processor Broadcast ... [starting]`);
  const options = createProcessorBroadcastOptions(
    config,
    traceProcessorMapper,
    deltaProcessorMapper
  );
  const client = await setupBroadcast(config.url, options);
  log(` *  Processor Broadcast ... [ready]`);
  return new ProcessorBroadcast(client);
};
