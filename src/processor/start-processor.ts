/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { log } from '@alien-worlds/api-core';
import { BroadcastMessage, BroadcastMessageContentMapper } from '../common/broadcast';
import {
  Featured,
  FeaturedConfig,
  FeaturedContent,
  FeaturedDelta,
  FeaturedTrace,
} from '../common/featured';
import { WorkerMessage } from '../common/workers/worker-message';
import { WorkerPool } from '../common/workers/worker-pool';
import { ProcessorBroadcast, setupProcessorBroadcast } from './processor.broadcast';
import { ProcessorConfig } from './processor.config';
import { ProcessorMessageContent } from './processor.types';
import { DeltaProcessorMessageContent } from './tasks/delta-processor.message-content';
import { TraceProcessorMessageContent } from './tasks/trace-processor.message-content';

export const handleProcessorWorkerMessage = async (
  workerMessage: WorkerMessage,
  broadcastMessage: BroadcastMessage<ProcessorMessageContent>,
  workerPool: WorkerPool,
  broadcast: ProcessorBroadcast
): Promise<void> => {
  if (workerMessage.isTaskResolved()) {
    broadcastMessage.ack();
  } else {
    broadcastMessage.reject();
  }
  await workerPool.releaseWorker(workerMessage.workerId);
  //
  if (broadcast.isPaused) {
    await broadcast.resume();
  }

  if (!workerPool.hasActiveWorkers()) {
    log(`All the threads have finished their work. Waiting for new tasks...`);
  }
};

export const handleProcessorWorkerError = async (
  error: Error,
  broadcastMessage: BroadcastMessage<ProcessorMessageContent>
): Promise<void> => {
  broadcastMessage.postpone();
};

/**
 *
 * @param broadcastMessage
 * @param featured
 * @param workerPool
 */
export const handleProcessorBroadcastMessage = async (
  broadcastMessage: BroadcastMessage<ProcessorMessageContent>,
  featured: Featured<FeaturedTrace | FeaturedDelta>,
  workerPool: WorkerPool,
  broadcast: ProcessorBroadcast
): Promise<void> => {
  const { content } = broadcastMessage;
  const processorPath = featured.getProcessor(content.label);

  if (processorPath) {
    const worker = workerPool.getWorker(processorPath);
    if (worker) {
      worker.onMessage(workerMessage =>
        handleProcessorWorkerMessage(
          workerMessage,
          broadcastMessage,
          workerPool,
          broadcast
        )
      );
      worker.onError(error => handleProcessorWorkerError(error, broadcastMessage));
      worker.run(content);
    } else {
      // We have a defined processor for this particular action,
      // but there are no free resources to run it,
      // so we need to postpone the execution
      broadcast.pause();
      broadcastMessage.postpone();
    }
  } else {
    // We do not have a defined processor for this particular action,
    // so we have to discard it so that it does not stay in the queue
    broadcastMessage.reject();
  }
};

/**
 *
 * @param featuredContent
 * @param broadcastMessageMapper
 * @param config
 */
export const startProcessor = async (
  config: ProcessorConfig,
  traceProcessorMapper?: BroadcastMessageContentMapper<TraceProcessorMessageContent>,
  deltaProcessorMapper?: BroadcastMessageContentMapper<DeltaProcessorMessageContent>
) => {
  log(`Processor ... [starting]`);
  const featured = new FeaturedContent(config.featured);
  const broadcast = await setupProcessorBroadcast(
    config.broadcast,
    traceProcessorMapper,
    deltaProcessorMapper
  );
  const workerPool = new WorkerPool({ threadsCount: config.threads });
  log(` *  Worker Pool (max ${workerPool.workerMaxCount} workers) ... [ready]`);

  broadcast.onTraceMessage(
    async (message: BroadcastMessage<TraceProcessorMessageContent>) =>
      handleProcessorBroadcastMessage(message, featured.traces, workerPool, broadcast)
  );

  broadcast.onDeltaMessage((message: BroadcastMessage<DeltaProcessorMessageContent>) =>
    handleProcessorBroadcastMessage(message, featured.deltas, workerPool, broadcast)
  );
  log(`Processor ... [ready]`);
};
