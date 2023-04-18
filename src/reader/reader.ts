import { log, MongoSource } from '@alien-worlds/api-core';
import { BlockRangeScanner } from './block-range-scanner';
import { Mode } from '../common/common.enums';
import { WorkerMessage, WorkerPool } from '../common/workers';
import ReaderWorker from './reader.worker';
import { ReaderConfig, ReadTaskData } from './reader.types';
import { BlockState } from '../common/block-state';

export class Reader {
  public static async create(config: ReaderConfig): Promise<Reader> {
    const mongoSource = await MongoSource.create(config.mongo);
    const scanner = await BlockRangeScanner.create(mongoSource, config.scanner);
    const workerPool = await WorkerPool.create<ReaderWorker>({
      threadsCount: config.workers?.threadsCount || 1,
      sharedData: { config },
      defaultWorkerPath: `${__dirname}/reader.worker`,
      workerLoaderPath: `${__dirname}/reader.worker-loader`,
    });

    return new Reader(workerPool, config.mode, scanner);
  }

  private loop = false;
  private scanKey: string;

  protected constructor(
    private workerPool: WorkerPool<ReaderWorker>,
    private mode: string,
    private scanner: BlockRangeScanner
  ) {
    workerPool.onWorkerRelease(() => {
      const { mode, scanKey } = this;
      if (this.mode === Mode.Replay) {
        this.read({ mode, scanKey });
      } else {
        //
      }
    });
  }

  private async handleWorkerMessage(message: WorkerMessage) {
    const { workerPool } = this;
    if (message.isTaskResolved() || message.isTaskRejected()) {
      workerPool.releaseWorker(message.workerId);
    }
  }

  private async handleWorkerError(id: number, error: Error) {
    log(error);
    this.workerPool.releaseWorker(id);
  }

  public async read(task: ReadTaskData) {
    if (this.loop) {
      return;
    }

    const { mode, scanKey, startBlock, endBlock } = task;
    this.loop = true;

    while (this.loop) {
      const worker = await this.workerPool.getWorker();
      if (worker) {
        worker.onMessage(message => this.handleWorkerMessage(message));
        worker.onError((id, error) => this.handleWorkerError(id, error));

        if (mode === Mode.Default || mode === Mode.Test) {
          worker.run({ startBlock, endBlock });
        } else if (mode === Mode.Replay) {
          const scan = await this.scanner.getNextScanNode(scanKey);
          worker.run({ startBlock: scan.start, endBlock: scan.end, scanKey });
        }
      } else {
        this.loop = false;
      }
    }
  }
}
