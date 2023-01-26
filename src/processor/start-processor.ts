import { log } from '@alien-worlds/api-core';
import { FeaturedContractContent } from '../common/featured';
import { createWorkerPool, WorkerMessage, WorkerPool } from '../common/workers';
import { ProcessorAddons, ProcessorConfig } from './processor.config';
import { startProcessorBroadcastClient } from './processor.broadcast';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
  ProcessorBroadcastMessages,
} from '../internal-broadcast';
import { InternalBroadcastMessage } from '../internal-broadcast/internal-broadcast.message';
import {
  ProcessorQueue,
  ProcessorTaskModel,
  setupProcessorQueue,
} from '../common/processor-queue';

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
  const { matchers } = addons;
  const broadcast = await startProcessorBroadcastClient(config.broadcast);
  const processorQueue = await setupProcessorQueue(config.mongo);
  const featuredContent = new FeaturedContractContent(config.featured, matchers);
  const workerPool = await createWorkerPool({
    ...workers,
    workerLoaderPath: `${__dirname}/processor.worker-loader`,
  });
  workerPool.onWorkerRelease(() =>
    runNextProcessor(workerPool, processorQueue, featuredContent)
  );

  log(` *  Worker Pool (max ${workerPool.workerMaxCount} workers) ... [ready]`);

  broadcast.onMessage(
    InternalBroadcastChannel.Processor,
    async (message: InternalBroadcastMessage) => {
      if (
        message.content.name === InternalBroadcastMessageName.ProcessorTasksQueueUpdate
      ) {
        runNextProcessor(workerPool, processorQueue, featuredContent);
      }
    }
  );

  // Everything is ready, notify the block-range that the process is ready to work
  broadcast.sendMessage(ProcessorBroadcastMessages.createProcessorReadyMessage());

  // start processor in case the queue already contains tasks
  runNextProcessor(workerPool, processorQueue, featuredContent);

  log(`Processor ... [ready]`);
};

export const runNextProcessor = async (
  workerPool: WorkerPool,
  queue: ProcessorQueue,
  featuredContent: FeaturedContractContent
) => {
  if (await queue.hasTask()) {
    if (workerPool.hasAvailableWorker()) {
      const task = await queue.nextTask();
      if (task) {
        const processorName = await featuredContent.getProcessor(task.type, task.label);
        if (processorName) {
          const worker = await workerPool.getWorker(processorName);
          worker.onMessage(async (message: WorkerMessage<ProcessorTaskModel>) => {
            // remove the task from the queue if it has been completed
            if (message.isTaskResolved()) {
              await queue.removeTask(task.id);
              log(
                `Worker #${worker.id} has completed (successfully) work on the task "${task.id}". Worker to be released.`
              );
            } else {
              // TODO: what to do with tasks that keep failing?
              log(message.error);
              log(
                `Worker #${worker.id} has completed (unsuccessfully) work on the task "${task.id}".
            The task will remain in the queue until the next attempt. Worker to be released.`
              );
            }
            // release the worker when he has finished his work
            workerPool.releaseWorker(message.workerId);
          });
          worker.onError(error => {
            log(error);
            // release the worker in case of an error
            workerPool.releaseWorker(worker.id);
          });
          // start worker
          worker.run(task);
          log(`Worker #${worker.id} has been assigned to process task ${task.id}`);
        } else {
          log(
            `There is a task in the queue for which no processor has been assigned, check label: ${task.label}`
          );
        }
      }
    }
  } else {
    log(`No more tasks. Well done!`);
  }
};
