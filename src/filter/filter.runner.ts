import { log } from '@alien-worlds/api-core';
import { WorkerMessage, WorkerPool } from '../common/workers';
import { FilterAddons, FilterConfig } from './filter.types';
import { filterWorkerLoaderPath } from './filter.consts';
import { BlockRepository } from '../reader/blocks';
import { BlockNotFoundError } from '../reader/blocks/block.errors';
import { BlockJson } from '../reader';

export class FilterRunner {
  public static async create(config: FilterConfig, addons: FilterAddons) {
    const { workers } = config;
    const { matchers } = addons;
    const blocks = await BlockRepository.create(config.mongo);

    const workerPool = await WorkerPool.create({
      ...workers,
      sharedData: { config, matchers },
      workerLoaderPath: filterWorkerLoaderPath,
    });
    const runner = new FilterRunner(workerPool, blocks);

    workerPool.onWorkerRelease(() => runner.next());

    log(` *  Worker Pool (max ${workerPool.workerMaxCount} workers) ... [ready]`);

    return runner;
  }

  private interval: NodeJS.Timeout;
  private loop: boolean;

  constructor(private workerPool: WorkerPool, private blocks: BlockRepository) {
    this.interval = setInterval(async () => {
      if (this.workerPool.hasActiveWorkers() === false) {
        log(`All workers are available, checking if there blocks to parse...`);
        this.next();
      }
    }, 5000);
  }

  public async next() {
    const { workerPool, blocks } = this;

    // block multiple requests
    if (this.loop) {
      return;
    }

    this.loop = true;

    while (this.loop) {
      const worker = await workerPool.getWorker();
      if (worker) {
        const { content: block, failure } = await blocks.next();
        if (failure) {
          if (failure.error instanceof BlockNotFoundError) {
            log(`There are currently no blocks to deserialize...`);
          } else {
            log(failure.error);
          }
          this.loop = false;
        } else {
          worker.onMessage(async (message: WorkerMessage<BlockJson>) => {
            if (message.isTaskRejected()) {
              log(message.error);
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
