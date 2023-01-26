import { log } from '@alien-worlds/api-core';
import { Abis } from '../../common/abis';
import { BlockRangeScanner } from '../../common/block-range-scanner';
import { Mode } from '../../common/common.enums';
import { BlockRangeTaskData } from '../../common/common.types';
import { WorkerMessage, WorkerPool } from '../../common/workers';
import { blockRangeReplayModeTaskPath } from '../block-range.consts';
import { BlockRangeScanRegistry } from './block-range.registry';
import { BlockRangeService } from './block-range.service';

export class BlockRangeReplayService implements BlockRangeService {
  public readonly mode = Mode.Replay;

  private _isIdle = true;
  private _scanKey: string;
  private registry: BlockRangeScanRegistry;

  constructor(
    private abis: Abis,
    private workerPool: WorkerPool,
    private scanner: BlockRangeScanner
  ) {
    workerPool.onWorkerRelease(() => this.next());
    this.registry = new BlockRangeScanRegistry();
  }

  public dispose(): void {
    this.workerPool.removeWorkers();
  }

  public isIdle() {
    return this._isIdle;
  }

  public async next(scanKey?: string) {
    const { scanner, abis, workerPool, registry } = this;

    if (this._isIdle === false) {
      log(
        `Block Range is currently scanning so the received task will be added to the queue.`
      );
      return;
    }

    if (scanKey?.length > 0 && scanKey !== this._scanKey) {
      log(`New key ${scanKey} set for next block range scans.`);
      this._scanKey = scanKey;
    }

    if (!this._scanKey) {
      log(`Scan key not provided, scan cannot be performed.`);
      return;
    }

    this._isIdle = false;

    // assign tasks to available workers one by one
    while (
      workerPool.hasAvailableWorker() &&
      (await scanner.hasUnscannedBlocks(this._scanKey))
    ) {
      const scan = await scanner.getNextScanNode(this._scanKey);
      // make sure the scan is available and not being processed by another worker
      if (scan && registry.has(scan.hash) === false) {
        const { start, end, hash } = scan;

        await abis.getAbis(start, end, null, true);
        const worker = await workerPool.getWorker(blockRangeReplayModeTaskPath);
        log(
          `  -  Block Range thread #${
            worker.id
          } reads ${start.toString()}:${end.toString()} [starting]`
        );
        worker.onMessage(async (message: WorkerMessage<BlockRangeTaskData>) => {
          log(
            `  -  Block Range thread #${
              worker.id
            } reads ${start.toString()}:${end.toString()} [${
              message.isTaskResolved() ? 'task resolved' : 'task rejected'
            }]`
          );
          // release the worker and remove scan hash from the registry
          registry.removeByWorkerId(message.workerId);
          workerPool.releaseWorker(message.workerId);
        });
        worker.onError(error => {
          log(error);
          // release the worker in case of an error and remove scan hash from the registry
          registry.removeByWorkerId(worker.id);
          workerPool.releaseWorker(worker.id);
        });

        // Add the task to the registry and start the worker
        registry.add(worker.id, hash);
        worker.run<BlockRangeTaskData>({
          startBlock: start,
          endBlock: end,
          mode: Mode.Replay,
          scanKey: this._scanKey,
        });
      }
    }

    this._isIdle = true;

    if ((await scanner.hasUnscannedBlocks(this._scanKey)) === false) {
      log(`No more block ranges to scan. Well done!`);
    }
  }
}
