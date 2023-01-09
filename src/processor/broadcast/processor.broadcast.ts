import { ProcessorBroadcastMapper } from './processor.mapper';
import {
  BroadcastAmqClient,
  BroadcastConfig,
  BroadcastMessage,
  BroadcastMessageContentMapper,
  BroadcastOptions,
  MessageHandler,
  setupBroadcast,
} from '../../common/broadcast';
import { TraceProcessorTaskBroadcastMapper } from './trace-processor-task.mapper';
import { DeltaProcessorTaskBroadcastMapper } from './delta-processor-task.mapper';
import { DeltaProcessorTaskMessageContent } from './delta-processor-task.message-content';
import { TraceProcessorTaskMessageContent } from './trace-processor-task.message-content';
import { log } from '@alien-worlds/api-core';
import {
  ProcessorMessageName,
  ProcessorMessageContent,
} from './processor.message-content';

export abstract class ProcessorBroadcastEmmiter {
  public abstract sendTraceMessage(data: TraceProcessorTaskMessageContent): Promise<void>;
  public abstract sendDeltaMessage(data: DeltaProcessorTaskMessageContent): Promise<void>;
}

const traceQueueName = 'trace_processor_task';
const deltaQueueName = 'delta_processor_task';
const orchestratorQueueName = 'processor';

export class ProcessorBroadcast implements ProcessorBroadcastEmmiter {
  constructor(private client: BroadcastAmqClient, private paused?: boolean) {}

  public sendIsProcessorReadyMessage(): Promise<void> {
    return this.client.sendMessage(
      orchestratorQueueName,
      ProcessorMessageContent.create(ProcessorMessageName.IsProcessorReady)
    );
  }

  public sendProcessorReadyMessage(): Promise<void> {
    return this.client.sendMessage(
      orchestratorQueueName,
      ProcessorMessageContent.create(ProcessorMessageName.ProcessorReady)
    );
  }

  public sendProcessorBusyMessage(): Promise<void> {
    return this.client.sendMessage(
      orchestratorQueueName,
      ProcessorMessageContent.create(ProcessorMessageName.ProcessorBusy)
    );
  }

  public sendTraceMessage(data: TraceProcessorTaskMessageContent): Promise<void> {
    return this.client.sendMessage(traceQueueName, data);
  }

  public sendDeltaMessage(data: DeltaProcessorTaskMessageContent): Promise<void> {
    return this.client.sendMessage(deltaQueueName, data);
  }

  public onReadyMessage(
    handler: MessageHandler<BroadcastMessage<ProcessorMessageContent>>
  ): void {
    this.client
      .onMessage(
        orchestratorQueueName,
        async (message: BroadcastMessage<ProcessorMessageContent>) => {
          if (message.content.name === ProcessorMessageName.ProcessorReady) {
            handler(message);
          }
        }
      )
      .catch(log);
  }

  public onBusyMessage(handler: MessageHandler<BroadcastMessage>): void {
    this.client
      .onMessage(
        orchestratorQueueName,
        async (message: BroadcastMessage<ProcessorMessageContent>) => {
          if (message.content.name === ProcessorMessageName.ProcessorBusy) {
            handler(message);
          }
        }
      )
      .catch(log);
  }

  public onTraceMessage(
    handler: MessageHandler<BroadcastMessage<TraceProcessorTaskMessageContent>>
  ): void {
    this.client.onMessage(traceQueueName, handler).catch(log);
  }

  public onDeltaMessage(
    handler: MessageHandler<BroadcastMessage<DeltaProcessorTaskMessageContent>>
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

  public async ack(message: BroadcastMessage): Promise<void> {
    return this.client.ack(message);
  }

  public async reject(message: BroadcastMessage): Promise<void> {
    return this.client.reject(message, false);
  }

  public async postpone(message: BroadcastMessage): Promise<void> {
    return this.client.reject(message, true);
  }

  public get isPaused(): boolean {
    return this.paused;
  }
}

export const createProcessorBroadcastOptions = (
  config: BroadcastConfig,
  mappers?: {
    traceProcessorMapper?: BroadcastMessageContentMapper;
    deltaProcessorMapper?: BroadcastMessageContentMapper;
    orchestratorMapper?: BroadcastMessageContentMapper;
  }
): BroadcastOptions => {
  const { traceProcessorMapper, deltaProcessorMapper, orchestratorMapper } =
    mappers || {};
  return {
    prefetch: 0,
    queues: [
      {
        name: traceQueueName,
        options: { durable: true },
        mapper: traceProcessorMapper || new TraceProcessorTaskBroadcastMapper(),
        fireAndForget: false,
      },
      {
        name: deltaQueueName,
        options: { durable: true },
        mapper: deltaProcessorMapper || new DeltaProcessorTaskBroadcastMapper(),
        fireAndForget: false,
      },
      {
        name: orchestratorQueueName,
        options: { durable: false },
        mapper: orchestratorMapper || new ProcessorBroadcastMapper(),
        fireAndForget: true,
      },
    ],
  };
};

export const setupProcessorBroadcast = async (
  config: BroadcastConfig,
  mappers?: {
    traceProcessorMapper?: BroadcastMessageContentMapper<TraceProcessorTaskMessageContent>;
    deltaProcessorMapper?: BroadcastMessageContentMapper<DeltaProcessorTaskMessageContent>;
    orchestratorMapper?: BroadcastMessageContentMapper<ProcessorMessageContent>;
  }
) => {
  log(` *  Processor Broadcast ... [starting]`);
  const { traceProcessorMapper, deltaProcessorMapper, orchestratorMapper } =
    mappers || {};
  const options = createProcessorBroadcastOptions(config, {
    traceProcessorMapper,
    deltaProcessorMapper,
    orchestratorMapper,
  });
  const client = await setupBroadcast(config.url, options);
  log(` *  Processor Broadcast ... [ready]`);
  return new ProcessorBroadcast(client);
};
