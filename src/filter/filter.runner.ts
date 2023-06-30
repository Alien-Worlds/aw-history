import { log } from '@alien-worlds/api-core';
import { BlockJson } from '@alien-worlds/block-reader';
import { WorkerMessage, WorkerPool } from '@alien-worlds/workers';
import { BlockNotFoundError, UnprocessedBlockQueueReader } from '../common';

export class FilterRunner {
  private interval: NodeJS.Timeout;
  private loop: boolean;
  private transitionHandler: (...args: unknown[]) => void | Promise<void>;

  constructor(
    private workerPool: WorkerPool,
    private blocks: UnprocessedBlockQueueReader
  ) {
    this.interval = setInterval(async () => {
      if (this.workerPool.hasActiveWorkers() === false) {
        log(`All workers are available, checking if there blocks to parse...`);
        this.next();
      }
    }, 5000);
  }

  public onTransition(handler: (...args: unknown[]) => void | Promise<void>) {
    this.transitionHandler = handler;
  }

  public async next() {
    const { workerPool, blocks } = this;

    // block multiple requests
    if (this.loop) {
      return;
    }

    this.loop = true;

    while (this.loop) {
      if (workerPool.hasAvailableWorker()) {
        const { content: block, failure } = await blocks.next();
        if (failure) {
          if (failure.error instanceof BlockNotFoundError) {
            log(`No blocks to deserialize found....`);
          } else {
            log(failure.error);
          }
          this.loop = false;
        } else {
          const worker = await workerPool.getWorker();
          worker.onMessage(async (message: WorkerMessage<BlockJson>) => {
            if (message.isTaskRejected()) {
              log(message.error);
            } else if (message.isTaskResolved() && this.transitionHandler) {
              this.transitionHandler();
            }
            workerPool.releaseWorker(message.workerId);
          });
          worker.onError((id, error) => {
            log(error);
            workerPool.releaseWorker(id);
          });

          worker.run(block.toJson());
        }
      } else {
        this.loop = false;
      }
    }
  }
}
