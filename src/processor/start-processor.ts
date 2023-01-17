import { log } from '@alien-worlds/api-core';
import { FeaturedContractContent } from '../common/featured';
import { WorkerMessage, WorkerPool } from '../common/workers';
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
  const intervalDelay = config.intervalDelay || 1000;
  const { matchers } = addons;
  const broadcast = await startProcessorBroadcastClient(config.broadcast);
  const processorQueue = await setupProcessorQueue(config.mongo);
  const featuredContent = new FeaturedContractContent(config.featured, matchers);
  const workerPool = new WorkerPool(workers);
  const processorInterval = new ProcessorInterval(
    assignProcessorTasks,
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

export const countIterations = async (workerPool: WorkerPool, queue: ProcessorQueue) => {
  const tasksCount = await queue.countTasks();
  const availableWorkerCount = workerPool.countAvailableWorker();

  if (tasksCount >= availableWorkerCount) {
    return availableWorkerCount;
  } else if (tasksCount < availableWorkerCount) {
    return tasksCount;
  } else {
    return 0;
  }
};

export const assignProcessorTasks = async (
  workerPool: WorkerPool,
  queue: ProcessorQueue,
  featuredContent: FeaturedContractContent
) => {
  let iterations = await countIterations(workerPool, queue);

  while (iterations-- > 0) {
    if (workerPool.hasAvailableWorker() && (await queue.hasTask())) {
      const task = await queue.nextTask();
      const processorName = await featuredContent.getProcessor(task.type, task.label);

      if (processorName) {
        const worker = workerPool.getWorker(processorName);
        worker.onMessage(async (message: WorkerMessage<ProcessorTaskModel>) => {
          // remove the task from the queue if it has been completed
          if (message.isTaskResolved()) {
            await queue.removeTask(task.id);
            log(
              `Worker #${worker.id} has completed (successfully) work on the task ${task.id}.`
            );
          } else {
            log(
              `Worker #${worker.id} has completed (unsuccessfully) work on the task ${task.id}. The task will remain in the queue until the next attempt.`
            );
          }
          // release the worker when he has finished his work
          workerPool.releaseWorker(message.workerId);
        });
        worker.onError(error => log(error));
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
};
