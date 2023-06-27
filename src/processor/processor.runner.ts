import {
  ContractDeltaMatchCriteria,
  ContractTraceMatchCriteria,
  FeaturedMapper,
  ProcessorTask,
  ProcessorTaskModel,
  ProcessorTaskQueue,
  ProcessorTaskType,
  UnknownProcessorTypeError,
  WorkerMessage,
  WorkerPool,
  log,
} from '@alien-worlds/history-tools-common';

export class ProcessorRunner {
  private interval: NodeJS.Timeout;
  private loop: boolean;

  constructor(
    protected featuredTraces: FeaturedMapper<ContractTraceMatchCriteria>,
    protected featuredDeltas: FeaturedMapper<ContractDeltaMatchCriteria>,
    protected workerPool: WorkerPool,
    protected queue: ProcessorTaskQueue
  ) {
    this.interval = setInterval(async () => {
      if (this.workerPool.hasActiveWorkers() === false) {
        log(`All workers are available, checking if there is something to do...`);
        this.next();
      }
    }, 5000);

    workerPool.onWorkerRelease(() => this.next());
  }

  private async assignTask(task: ProcessorTask) {
    const { queue, workerPool, featuredTraces, featuredDeltas } = this;
    let processorName: string;

    if (task.type === ProcessorTaskType.Delta) {
      processorName = await featuredDeltas.getProcessor(task.label);
    } else if (task.type === ProcessorTaskType.Trace) {
      processorName = await featuredTraces.getProcessor(task.label);
    } else {
      this.queue.stashUnsuccessfulTask(task, new UnknownProcessorTypeError(task.type));
      log(`Unknown processor task type "${task.label}". Task has been deleted.`);
      return;
    }

    // const processorName = await featured.getProcessor(task.type, task.label);
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
            queue.stashUnsuccessfulTask(task, message.error as Error);
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
