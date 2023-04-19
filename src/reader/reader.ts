import { Broadcast, BroadcastClient, log, MongoSource } from '@alien-worlds/api-core';
import { BlockRangeScanner } from './block-range-scanner';
import { Mode } from '../common/common.enums';
import { WorkerMessage, WorkerPool } from '../common/workers';
import ReaderWorker from './reader.worker';
import {
  ReadCompleteData,
  ReaderConfig,
  ReadProgressData,
  ReadTaskData,
} from './reader.types';
import { InternalBroadcastClientName } from '../broadcast';
import { FilterBroadcastMessage } from '../broadcast/messages';

export class Reader {
  public static async create(
    config: ReaderConfig,
    broadcastClient?: BroadcastClient
  ): Promise<Reader> {
    const mongoSource = await MongoSource.create(config.mongo);
    const scanner = await BlockRangeScanner.create(mongoSource, config.scanner);
    const workerPool = await WorkerPool.create<ReaderWorker>({
      threadsCount: config.workers?.threadsCount || 1,
      sharedData: { config },
      defaultWorkerPath: `${__dirname}/reader.worker`,
      workerLoaderPath: `${__dirname}/reader.worker-loader`,
    });
    let broadcast: BroadcastClient;
    if (!broadcastClient) {
      broadcast = await Broadcast.createClient({
        ...config.broadcast,
        clientName: InternalBroadcastClientName.Reader,
      });
      broadcast.connect();
    } else {
      broadcast = broadcastClient;
    }
    return new Reader(workerPool, config.mode, scanner, broadcast);
  }

  private loop = false;

  protected constructor(
    private workerPool: WorkerPool<ReaderWorker>,
    private mode: string,
    private scanner: BlockRangeScanner,
    private broadcast: BroadcastClient
  ) {
    workerPool.onWorkerRelease((id, task: ReadTaskData) => {
      const { mode } = this;
      if (this.mode === Mode.Replay && task) {
        const { scanKey } = task;
        this.read({ mode, scanKey });
      } else {
        //
      }
    });
  }

  private async handleWorkerMessage(message: WorkerMessage) {
    const { workerPool, broadcast } = this;
    const { data, error, workerId } = message;

    if (message.isTaskResolved()) {
      const { startBlock, endBlock } = <ReadCompleteData>data;
      log(
        `All blocks in the range ${startBlock.toString()} - ${endBlock.toString()} have been read.`
      );
      workerPool.releaseWorker(workerId, data);
    } else if (message.isTaskRejected()) {
      log(`An unexpected error occurred while reading blocks...`, error);
      workerPool.releaseWorker(workerId);
    } else if (message.isTaskProgress()) {
      broadcast.sendMessage(FilterBroadcastMessage.refresh());
    }
  }

  private async handleWorkerError(id: number, error: Error) {
    log(`Worker error:`, error);
    this.workerPool.releaseWorker(id);
  }

  public async read(task: ReadTaskData) {
    if (this.loop) {
      return;
    }

    const { mode, scanKey, startBlock, endBlock } = task;
    this.loop = true;

    if (mode === Mode.Replay && startBlock && endBlock) {
      log(
        `Preparation for scanning block range (${startBlock}-${endBlock}) under the label "${scanKey}"`
      );
    }

    while (this.loop) {
      const worker = await this.workerPool.getWorker();
      if (worker) {
        worker.onMessage(message => this.handleWorkerMessage(message));
        worker.onError((id, error) => this.handleWorkerError(id, error));

        if (mode === Mode.Default || mode === Mode.Test) {
          worker.run({ startBlock, endBlock });
        } else if (mode === Mode.Replay) {
          const scan = await this.scanner.getNextScanNode(scanKey);

          if (scan) {
            worker.run({ startBlock: scan.start, endBlock: scan.end, scanKey });
          } else {
            log(
              `The scan of the range (${startBlock}-${endBlock}) under the label "${scanKey}" has already been completed. No subranges to process.`
            );
            this.workerPool.releaseWorker(worker.id);
            this.loop = false;
          }
        }
      } else {
        this.loop = false;
      }
    }
  }
}
