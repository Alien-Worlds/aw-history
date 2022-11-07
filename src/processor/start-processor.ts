/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  BroadcastMessage,
  BroadcastMessageContentMapper,
  setupBroadcast,
} from '../common/broadcast';
import { WorkerMessage } from '../common/workers/worker-message';
import { WorkerPool } from '../common/workers/worker-pool';
import { createProcessorBroadcastOptions } from './processor.broadcast';
import { ProcessorConfig } from './processor.config';
import { TraceProcessorTaskInput } from './tasks/trace-processor.task-input';

/**
 *
 * @param message
 * @param processors
 * @param workerPool
 */
export const handleProcessorMessage = (
  message: BroadcastMessage<TraceProcessorTaskInput>,
  processors: Map<string, string>,
  workerPool: WorkerPool
) => {
  const { content } = message;
  const processorPath = processors.get(content.allocation);
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
 * @param processors
 * @param broadcastMessageMapper
 * @param config
 */
export const startProcessor = async (
  config: ProcessorConfig,
  processors: Map<string, string>,
  broadcastMessageMapper?: BroadcastMessageContentMapper
) => {
  const {
    broadcast: { url },
  } = config;
  const broadcastOptions = createProcessorBroadcastOptions(broadcastMessageMapper);
  const channel = broadcastOptions.queues[0].name;
  const broadcast = await setupBroadcast(url, broadcastOptions);
  const workerPool = new WorkerPool({ threadsCount: config.threads });

  broadcast.onMessage(channel, (message: BroadcastMessage<TraceProcessorTaskInput>) =>
    handleProcessorMessage(message, processors, workerPool)
  );
};
