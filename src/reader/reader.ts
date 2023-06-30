import { ReadCompleteData, ReadTaskData } from './reader.types';
import { FilterBroadcastMessage } from '../broadcast/messages';
import { log } from '@alien-worlds/api-core';
import { BroadcastClient } from '@alien-worlds/broadcast';
import { WorkerPool, WorkerMessage } from '@alien-worlds/workers';
import { BlockRangeScanner, Mode } from '../common';

export class Reader {
  private loop = false;
  private initTaskData: ReadTaskData;

  constructor(
    protected broadcastClient: BroadcastClient,
    protected scanner: BlockRangeScanner,
    protected workerPool: WorkerPool
  ) {
    workerPool.onWorkerRelease(async () => {
      const { initTaskData } = this;
      if (initTaskData.mode === Mode.Replay) {
        if (await scanner.hasUnscannedBlocks(initTaskData.scanKey)) {
          this.read(initTaskData);
        }
      } else {
        //
      }
    });
  }

  private async handleWorkerMessage(message: WorkerMessage) {
    const { workerPool, broadcastClient } = this;
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
      broadcastClient.sendMessage(FilterBroadcastMessage.refresh());
    }
  }

  private async handleWorkerError(id: number, error: Error) {
    const { workerPool } = this;
    log(`Worker error:`, error);
    workerPool.releaseWorker(id);
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

    const { workerPool, scanner, initTaskData } = this;

    while (this.loop) {
      const worker = await workerPool.getWorker();
      if (worker) {
        worker.onMessage(message => this.handleWorkerMessage(message));
        worker.onError((id, error) => this.handleWorkerError(id, error));

        if (task.mode === Mode.Default || task.mode === Mode.Test) {
          worker.run({ startBlock: task.startBlock, endBlock: task.endBlock });
        } else if (task.mode === Mode.Replay) {
          const scan = await scanner.getNextScanNode(task.scanKey);

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
