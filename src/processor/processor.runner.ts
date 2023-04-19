import { log } from '@alien-worlds/api-core';
import { FeaturedContractContent } from '../common/featured';
import {
  ProcessorTaskQueue,
  ProcessorTask,
  ProcessorTaskModel,
} from './processor-task-queue';
import { WorkerMessage, WorkerPool } from '../common/workers';
import { ProcessorAddons, ProcessorConfig } from './processor.types';
import { processorWorkerLoaderPath } from './processor.consts';

export class ProcessorRunner {
  private static instance: ProcessorRunner;
  private static creatorPromise;

  private static async creator(config: ProcessorConfig, addons: ProcessorAddons) {
    const { workers } = config;
    const { matchers } = addons;
    const queue = await ProcessorTaskQueue.create(config.mongo, false, config.queue);
    const featuredContent = new FeaturedContractContent(config.featured, matchers);
    const workerPool = await WorkerPool.create({
      ...workers,
      workerLoaderPath: config.processorLoaderPath || processorWorkerLoaderPath,
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

  private interval: NodeJS.Timeout;
  private loop: boolean;

  constructor(
    private workerPool: WorkerPool,
    private queue: ProcessorTaskQueue,
    private featuredContent: FeaturedContractContent
  ) {
    this.interval = setInterval(async () => {
      if (this.workerPool.hasActiveWorkers() === false) {
        log(`All workers are available, checking if there is something to do...`);
        this.next();
      }
    }, 5000);
  }

  private async assignTask(task: ProcessorTask) {
    const { queue, workerPool, featuredContent } = this;

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
            log(
              `Worker #${worker.id} has completed (successfully) work on the task "${task.id}". Worker to be released.`
            );
            workerPool.releaseWorker(message.workerId);
          } else if (message.isTaskRejected()) {
            queue.stashUnsuccessfulTask(task, message.error);
            log(message.error);
            log(
              `Worker #${worker.id} has completed (unsuccessfully) work on the task "${task.id}".
                  The task was stashed for later analysis. Worker to be released.`
            );
            workerPool.releaseWorker(message.workerId);
          } else {
            // task in progress
          }
        });
        worker.onError((id, error) => {
          log(error);
          // stash failed task and release the worker in case of an error
          queue.stashUnsuccessfulTask(task, error);
          workerPool.releaseWorker(id);
        });
        // start worker
        worker.run(task);
        log(`Worker #${worker.id} has been assigned to process task ${task.id}`);
      } else {
        await this.queue.addTasks([task]);
      }
    } else {
      log(`Processor not found for task "${task.label}". Task has been deleted.`);
    }
  }

  public async next() {
    const { workerPool, queue } = this;

    // block multiple requests
    if (this.loop) {
      return;
    }

    this.loop = true;

    while (this.loop) {
      if (workerPool.hasAvailableWorker()) {
        const task = await queue.nextTask();
        if (task) {
          await this.assignTask(task);
        } else {
          log(`There are currently no tasks to work on...`);
          this.loop = false;
        }
      } else {
        this.loop = false;
      }
    }
  }
}
