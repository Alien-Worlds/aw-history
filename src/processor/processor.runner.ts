import { log } from '@alien-worlds/api-core';
import { FeaturedContractContent } from '../common/featured';
import {
  ProcessorQueue,
  ProcessorTaskModel,
  setupProcessorQueue,
} from '../common/processor-queue';
import { createWorkerPool, WorkerMessage, WorkerPool } from '../common/workers';
import { ProcessorAddons, ProcessorConfig } from './processor.config';
import { processorWorkerLoaderPath } from './processor.consts';

export class ProcessorRunner {
  private static instance: ProcessorRunner;
  private static creatorPromise;

  private static async creator(config: ProcessorConfig, addons: ProcessorAddons) {
    const { workers } = config;
    const { matchers } = addons;
    const queue = await setupProcessorQueue(config.mongo);
    const featuredContent = new FeaturedContractContent(config.featured, matchers);
    const workerPool = await createWorkerPool({
      ...workers,
      workerLoaderPath: processorWorkerLoaderPath,
    });
    const runner = new ProcessorRunner(workerPool, queue, featuredContent);

    workerPool.onWorkerRelease(() => runner.next());

    log(` *  Worker Pool (max ${workerPool.workerMaxCount} workers) ... [ready]`);
    ProcessorRunner.creatorPromise = null;
    ProcessorRunner.instance = runner;

    return runner;
  }

  public static async getInstance(
    config: ProcessorConfig,
    addons: ProcessorAddons
  ): Promise<ProcessorRunner> {
    if (ProcessorRunner.instance) {
      return ProcessorRunner.instance;
    }

    if (!ProcessorRunner.creatorPromise) {
      ProcessorRunner.creatorPromise = ProcessorRunner.creator(config, addons);
    }

    return ProcessorRunner.creatorPromise;
  }

  constructor(
    private workerPool: WorkerPool,
    private queue: ProcessorQueue,
    private featuredContent: FeaturedContractContent
  ) {}

  public async next() {
    const { queue, workerPool, featuredContent } = this;

    if (workerPool.hasAvailableWorker()) {
      // It begins by retrieving the next task from the queue. If there is a task, it then gets the processor name associated
      // with the task's type and label.
      const task = await queue.nextTask();

      if (task) {
        const processorName = await featuredContent.getProcessor(task.type, task.label);
        // If there is a processor name, it then gets a worker from the worker pool.
        if (processorName) {
          const worker = await workerPool.getWorker(processorName);
          // If there is a worker, it sets up event handlers for when the worker has completed its work or when an error occurs.
          // The worker is then started and assigned to process the task.
          // If there is no available worker, the task will be taken later by another worker
          if (worker) {
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
          }
        } else {
          log(
            `There is a task in the queue for which no processor has been assigned, check label: ${task.label}`
          );
          await queue.removeTask(task.id);
        }
      } else {
        log(`Waiting for the next tasks...`);
      }
    }
  }
}
