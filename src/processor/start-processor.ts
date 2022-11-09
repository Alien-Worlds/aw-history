/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { BroadcastMessage, BroadcastMessageContentMapper } from '../common/broadcast';
import { WorkerMessage } from '../common/workers/worker-message';
import { WorkerPool } from '../common/workers/worker-pool';
import { setupProcessorBroadcast } from './processor.broadcast';
import { ProcessorConfig } from './processor.config';
import { DeltaProcessorMessageContent } from './tasks/delta-processor.message-content';
import { TraceProcessorMessageContent } from './tasks/trace-processor.message-content';

/**
 *
 * @param message
 * @param processors
 * @param workerPool
 */
export const handleTraceMessage = async (
  message: BroadcastMessage<TraceProcessorMessageContent>,
  processors: Map<string, string>,
  workerPool: WorkerPool
): Promise<void> => {
  const { content } = message;
  const processorPath = processors.get(content.label);
  const worker = workerPool.getWorker(processorPath);

  if (worker && processorPath) {
    worker.onMessage(async (workerMessage: WorkerMessage) => {
      if (workerMessage.isTaskResolved()) {
        message.ack();
      } else {
        message.reject();
      }
      await workerPool.releaseWorker(workerMessage.pid);
    });
    worker.onError(error => {
      message.postpone();
    });
    worker.run(content);
  } else if (!worker && processorPath) {
    // We have a defined processor for this particular action,
    // but there are no free resources to run it,
    // so we need to postpone the execution
    message.postpone();
  } else {
    // We do not have a defined processor for this particular action,
    // so we have to discard it so that it does not stay in the queue
    message.reject();
  }
};

/**
 *
 * @param message
 * @param processors
 * @param workerPool
 */
export const handleDeltaMessage = async (
  message: BroadcastMessage<DeltaProcessorMessageContent>,
  processors: Map<string, string>,
  workerPool: WorkerPool
): Promise<void> => {
  //
};

/**
 *
 * @param processors
 * @param broadcastMessageMapper
 * @param config
 */
export const startProcessor = async (
  config: ProcessorConfig,
  processors: Map<string, string>,
  traceProcessorMapper?: BroadcastMessageContentMapper<TraceProcessorMessageContent>,
  deltaProcessorMapper?: BroadcastMessageContentMapper<DeltaProcessorMessageContent>
) => {
  const {
    broadcast: { url },
  } = config;

  const broadcast = await setupProcessorBroadcast(
    url,
    traceProcessorMapper,
    deltaProcessorMapper
  );
  const workerPool = new WorkerPool({ threadsCount: config.threads });

  broadcast.onTraceMessage((message: BroadcastMessage<TraceProcessorMessageContent>) =>
    handleTraceMessage(message, processors, workerPool)
  );

  broadcast.onDeltaMessage((message: BroadcastMessage<DeltaProcessorMessageContent>) =>
    handleDeltaMessage(message, processors, workerPool)
  );
};
