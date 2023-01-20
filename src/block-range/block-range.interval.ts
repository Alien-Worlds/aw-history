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
  const worker = await workerPool.getWorker(blockRangeReplayModeTaskPath);
  log(
    `  -  Block Range thread #${
      worker.id
    } reads ${start.toString()}:${end.toString()} [starting]`
  );
  worker.onMessage(async message => {
    const { workerId: pid } = message;
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
  private keepAlive = false;

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

    if ((await scanner.hasUnscannedBlocks(scanKey)) === false) {
      log(`No more block range tasks to distribute`);

      // When the keepAlive option is false, it means that interval can be started from the outside,
      // in such a case there is no point in keeping interval when none of the workers are working
      // and there are no more unscanned blocks
      if (this.keepAlive === false && workerPool.countActiveWorkers() === 0) {
        this.stop();
      }
    }
  }

  public start(scanKey: string, delay = 1000, keepAlive = false): void {
    this.keepAlive = keepAlive;
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
}
