import { log } from '@alien-worlds/api-core';
import { FeaturedContractContent } from '../common/featured';
import { ProcessorQueue, ProcessorTaskModel } from '../common/processor-queue';
import { WorkerMessage, WorkerPool } from '../common/workers';

export class ProcessorInterval {
  private timer: NodeJS.Timer = null;
  private isAssigning = false;

  constructor(
    private workerPool: WorkerPool,
    private queue: ProcessorQueue,
    private featuredContent: FeaturedContractContent
  ) {}

  private async countIterations() {
    const tasksCount = await this.queue.countTasks();
    const availableWorkerCount = this.workerPool.countAvailableWorker();

    if (tasksCount >= availableWorkerCount) {
      return availableWorkerCount;
    } else if (tasksCount < availableWorkerCount) {
      return tasksCount;
    } else {
      return 0;
    }
  }

  private async assignProcessorTasks() {
    const { workerPool, queue, featuredContent } = this;
    let iterations = await this.countIterations();
    this.isAssigning = true;
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
                `Worker #${worker.id} has completed (successfully) work on the task "${task.id}". Worker to be released.`
              );
            } else {
              log(
                `Worker #${worker.id} has completed (unsuccessfully) work on the task "${task.id}".
                The task will remain in the queue until the next attempt. Worker to be released.`
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

    this.isAssigning = false;

    if (await queue.hasTask()) {
      log(`All tasks have been assigned.`);
    }
  }

  public start(delay = 1000): void {
    if (!this.timer) {
      this.timer = setInterval(async () => {
        if (this.isAssigning === false) {
          this.assignProcessorTasks();
        }
      }, delay);
    }
  }

  public stop(): void {
    clearInterval(this.timer);
    this.timer = null;
  }
}
