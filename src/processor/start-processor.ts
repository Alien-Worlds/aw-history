import { log } from '@alien-worlds/api-core';
import { FeaturedContractContent } from '../common/featured';
import { WorkerPool } from '../common/workers';
import { ProcessorAddons, ProcessorConfig } from './processor.config';
import { startProcessorBroadcastClient } from './processor.broadcast';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
  ProcessorBroadcastMessages,
} from '../internal-broadcast';
import { InternalBroadcastMessage } from '../internal-broadcast/internal-broadcast.message';
import { setupProcessorQueue } from '../common/processor-queue';
import { ProcessorInterval } from './processor.interval';

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
  const intervalDelay = config.interval || 1000;
  const { matchers } = addons;
  const broadcast = await startProcessorBroadcastClient(config.broadcast);
  const processorQueue = await setupProcessorQueue(config.mongo);
  const featuredContent = new FeaturedContractContent(config.featured, matchers);
  const workerPool = new WorkerPool(workers);
  const processorInterval = new ProcessorInterval(
    workerPool,
    processorQueue,
    featuredContent
  );

  log(` *  Worker Pool (max ${workerPool.workerMaxCount} workers) ... [ready]`);

  broadcast.onMessage(
    InternalBroadcastChannel.Processor,
    async (message: InternalBroadcastMessage) => {
      if (
        message.content.name === InternalBroadcastMessageName.ProcessorTasksQueueUpdate
      ) {
        // queue contains new tasks
        // start work if processor is idle
        if (processorInterval.isIdle()) {
          processorInterval.start(intervalDelay);
        }
      }
    }
  );

  // Everything is ready, notify the block-range that the process is ready to work
  broadcast.sendMessage(ProcessorBroadcastMessages.createProcessorReadyMessage());

  // start processor in case the queue already contains tasks
  processorInterval.start(intervalDelay);

  log(`Processor ... [ready]`);
};
