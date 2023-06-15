import { log } from '@alien-worlds/api-core';
import { BlockRangeScanner } from './block-range-scanner';
import { Mode } from '../common/common.enums';
import { WorkerMessage, WorkerPool } from '../common/workers';
import ReaderWorker from './reader.worker';
import { ReadCompleteData, ReaderConfig, ReadTaskData } from './reader.types';
import { InternalBroadcastClientName } from '../broadcast';
import { FilterBroadcastMessage } from '../broadcast/messages';
import { MongoSource } from '@alien-worlds/storage-mongodb';

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
    return new Reader(workerPool, scanner, broadcast);
  }

  private loop = false;
  private isAlreadyStarted = false;
  private initTaskData: ReadTaskData;

  protected constructor(
    private workerPool: WorkerPool<ReaderWorker>,
    private scanner: BlockRangeScanner,
    private broadcast: BroadcastClient
  ) {
    workerPool.onWorkerRelease(async () => {
      const { initTaskData } = this;
      if (initTaskData.mode === Mode.Replay) {
        if (await this.scanner.hasUnscannedBlocks(initTaskData.scanKey)) {
          this.read(initTaskData);
        }
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
        `All blocks in the range ${startBlock.toString()} - ${endBlock.toString()} (exclusive) have been read.`
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
    this.loop = true;

    if (!this.initTaskData) {
      this.initTaskData = task;
      log(
        `Preparation for scanning block range (${task.startBlock}-${task.endBlock}) ${
          task.mode === Mode.Replay ? 'under the label ' + task.scanKey : ''
        }`
      );
    }

    while (this.loop) {
      const { initTaskData, workerPool } = this;
      const worker = await workerPool.getWorker();
      if (worker) {
        worker.onMessage(message => this.handleWorkerMessage(message));
        worker.onError((id, error) => this.handleWorkerError(id, error));

        if (task.mode === Mode.Default || task.mode === Mode.Test) {
          worker.run({ startBlock: task.startBlock, endBlock: task.endBlock });
        } else if (task.mode === Mode.Replay) {
          const scan = await this.scanner.getNextScanNode(task.scanKey);

          if (scan) {
            worker.run({
              startBlock: scan.start,
              endBlock: scan.end,
              scanKey: initTaskData.scanKey,
            });
          } else {
            log(
              `The scan of the range ${initTaskData.startBlock}-${initTaskData.endBlock}(exclusive) under the label "${initTaskData.scanKey}" has already been completed. No subranges to process.`
            );
            workerPool.releaseWorker(worker.id);
            this.loop = false;
          }
        }
      } else {
        this.loop = false;
      }
    }
  }
}
