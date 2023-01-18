import { log } from '@alien-worlds/api-core';
import { Abis } from '../common/abis';
import { BlockRangeScanner } from '../common/block-range-scanner';
import { Mode } from '../common/common.enums';
import { WorkerPool } from '../common/workers';
import { blockRangeReplayModeTaskPath } from './block-range.consts';

export const assignSingleTask = async (
  scanKey: string,
  scanner: BlockRangeScanner,
  workerPool: WorkerPool,
  abis: Abis
) => {
  const scan = await scanner.getNextScanNode(scanKey);
  const { start, end } = scan;
  await abis.getAbis(start, end, null, true);
  const worker = workerPool.getWorker(blockRangeReplayModeTaskPath);
  log(
    `  -  Block Range thread #${
      worker.id
    } reads ${start.toString()}:${end.toString()} [starting]`
  );
  worker.onMessage(async message => {
    const { workerId: pid } = message;
    message.isTaskResolved();
    log(
      `  -  Block Range thread #${
        worker.id
      } reads ${start.toString()}:${end.toString()} [${
        message.isTaskResolved() ? 'task resolved' : 'task rejected'
      }]`
    );
    workerPool.releaseWorker(pid);
  });
  worker.run({ startBlock: start, endBlock: end, mode: Mode.Replay, scanKey });
};

export class BlockRangeInterval {
  private timer: NodeJS.Timer = null;
  private isAssigning = false;

  constructor(
    private workerPool: WorkerPool,
    private scanner: BlockRangeScanner,
    private abis: Abis
  ) {}

  private async assignTasksToWorkers(scanKey: string) {
    const { workerPool, scanner, abis } = this;
    this.isAssigning = true;
    while (
      (await scanner.hasUnscannedBlocks(scanKey)) &&
      workerPool.hasAvailableWorker()
    ) {
      await assignSingleTask(scanKey, scanner, workerPool, abis);
    }
    this.isAssigning = false;
  }

  public start(scanKey: string, delay = 1000): void {
    // if the interval is active, let it finish, there is no point in starting another one,
    // because the tasks will be taken from the queue anyway
    if (this.timer === null) {
      this.timer = setInterval(async () => {
        if (this.isAssigning === false) {
          this.assignTasksToWorkers(scanKey);
        }
      }, delay);
    }
  }

  public stop(): void {
    clearInterval(this.timer);
    this.timer = null;
  }

  public isActive(): boolean {
    return this.timer !== null;
  }

  public isIdle(): boolean {
    return this.timer === null;
  }
}
