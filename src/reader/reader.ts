import { Broadcast, BroadcastClient, log, MongoSource } from '@alien-worlds/api-core';
import { BlockRangeScanner } from './block-range-scanner';
import { Mode } from '../common/common.enums';
import { WorkerMessage, WorkerPool } from '../common/workers';
import ReaderWorker from './reader.worker';
import { ReaderConfig, ReadTaskData } from './reader.types';
import { InternalBroadcastClientName } from '../broadcast';
import { FilterBroadcastMessage } from '../broadcast/messages';

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
    const broadcast = await Broadcast.createClient({
      ...config.broadcast,
      clientName: InternalBroadcastClientName.Reader,
    });
    broadcast.connect();
    return new Reader(workerPool, config.mode, scanner, broadcast);
  }

  private loop = false;
  private scanKey: string;

  protected constructor(
    private workerPool: WorkerPool<ReaderWorker>,
    private mode: string,
    private scanner: BlockRangeScanner,
    private broadcast: BroadcastClient
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
    const { workerPool, broadcast } = this;
    if (message.isTaskResolved() || message.isTaskRejected()) {
      workerPool.releaseWorker(message.workerId);
    } else {
      broadcast.sendMessage(FilterBroadcastMessage.update());
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
