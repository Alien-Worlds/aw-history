/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { log } from '@alien-worlds/api-core';
import { Abi, Abis } from '../common/abis';
import { setupAbis } from '../common/abis/abis.utils';
import { BroadcastMessage, BroadcastMessageContentMapper } from '../common/broadcast';
import {
  Featured,
  FeaturedContent,
  FeaturedDelta,
  FeaturedDeltas,
  FeaturedMatchers,
  FeaturedTrace,
  FeaturedTraces,
} from '../common/featured';
import { WorkerMessage } from '../common/workers/worker-message';
import { WorkerPool } from '../common/workers/worker-pool';
import {
  ProcessorBroadcast,
  setupProcessorBroadcast,
} from './broadcast/processor.broadcast';
import { ProcessorAddons, ProcessorConfig } from './processor.config';
import { ProcessorMessageContent } from './processor.types';
import { DeltaProcessorTaskMessageContent } from './broadcast/delta-processor-task.message-content';
import { TraceProcessorTaskMessageContent } from './broadcast/trace-processor-task.message-content';

export const handleProcessorWorkerMessage = async (
  workerMessage: WorkerMessage,
  broadcastMessage: BroadcastMessage<ProcessorMessageContent>,
  workerPool: WorkerPool,
  broadcast: ProcessorBroadcast
): Promise<void> => {
  if (workerMessage.isTaskResolved()) {
    broadcast.ack(broadcastMessage);
  } else {
    broadcast.reject(broadcastMessage);
  }
  await workerPool.releaseWorker(workerMessage.workerId);
  //
  if (broadcast.isPaused) {
    await broadcast.resume();
  }

  if (!workerPool.hasActiveWorkers()) {
    log(`All the threads have finished their work. Waiting for new tasks...`);
    broadcast.sendProcessorReadyMessage();
  }
};

export const handleProcessorWorkerError = async (
  error: Error,
  broadcast: ProcessorBroadcast,
  broadcastMessage: BroadcastMessage<ProcessorMessageContent>
): Promise<void> => {
  log(error);
  broadcast.postpone(broadcastMessage);
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
  broadcast: ProcessorBroadcast,
  abi?: Abi
): Promise<void> => {
  const { content } = broadcastMessage;
  const processorPath = await featured.getProcessor(content.label);

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
      worker.onError(error =>
        handleProcessorWorkerError(error, broadcast, broadcastMessage)
      );

      // pass the abi to the processor
      if (abi) {
        worker.use(abi);
      }

      worker.run(content);
    } else {
      // We have a defined processor for this particular action,
      // but there are no free resources to run it,
      // so we need to postpone the execution
      broadcast.pause();
      broadcast.postpone(broadcastMessage);
    }
  } else {
    // We do not have a defined processor for this particular action,
    // so we have to discard it so that it does not stay in the queue
    broadcast.reject(broadcastMessage);
  }
};

export const handleTraceBroadcastMessage =
  (
    abis: Abis,
    featured: FeaturedTraces,
    workerPool: WorkerPool,
    broadcast: ProcessorBroadcast
  ) =>
  async (message: BroadcastMessage<TraceProcessorTaskMessageContent>) => {
    const {
      content: { blockNumber, account, name },
    } = message;

    // get last matching Abi and pass it to the message handler
    const abi = await abis.getAbi(blockNumber, account);
    return handleProcessorBroadcastMessage(message, featured, workerPool, broadcast, abi);
  };

export const handleDeltaBroadcastMessage =
  (
    abis: Abis,
    featured: FeaturedDeltas,
    workerPool: WorkerPool,
    broadcast: ProcessorBroadcast
  ) =>
  async (message: BroadcastMessage<DeltaProcessorTaskMessageContent>) => {
    const {
      content: { blockNumber, code },
    } = message;
    // get last matching Abi and pass it to the message handler
    const abi = await abis.getAbi(blockNumber, code);
    return handleProcessorBroadcastMessage(message, featured, workerPool, broadcast, abi);
  };

/**
 *
 * @param featuredContent
 * @param broadcastMessageMapper
 * @param config
 */
export const startProcessor = async (
  config: ProcessorConfig,
  addons: ProcessorAddons = {}
) => {
  log(`Processor ... [starting]`);
  const { workers } = config;
  const { traceProcessorMapper, deltaProcessorMapper, orchestratorMapper, matchers } =
    addons;
  const featured = new FeaturedContent(config.featured, matchers);
  const abis = await setupAbis(config.mongo, config.abis, config.featured);

  const broadcast = await setupProcessorBroadcast(config.broadcast, {
    traceProcessorMapper,
    orchestratorMapper,
    deltaProcessorMapper,
  });
  const workerPool = new WorkerPool(workers);
  log(` *  Worker Pool (max ${workerPool.workerMaxCount} workers) ... [ready]`);

  broadcast.onTraceMessage(
    handleTraceBroadcastMessage(abis, featured.traces, workerPool, broadcast)
  );

  broadcast.onDeltaMessage(
    handleDeltaBroadcastMessage(abis, featured.deltas, workerPool, broadcast)
  );
  log(`Processor ... [ready]`);
};
