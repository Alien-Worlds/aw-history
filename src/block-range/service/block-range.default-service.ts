import { log } from '@alien-worlds/api-core';
import { Mode } from '../../common/common.enums';
import { BlockRangeTaskData } from '../../common/common.types';
import { WorkerPool } from '../../common/workers';
import { blockRangeDefaultModeTaskPath } from '../block-range.consts';
import { BlockRangeService } from './block-range.service';

export class BlockRangeDefaultService implements BlockRangeService {
  public readonly mode = Mode.Default;

  private _isIdle = true;

  constructor(private workerPool: WorkerPool) {}

  public dispose(): void {
    this.workerPool.removeWorkers();
  }

  public isIdle() {
    return this._isIdle;
  }

  public async start(data: BlockRangeTaskData) {
    if (this._isIdle && this.workerPool.hasAvailableWorker()) {
      this._isIdle = false;
      const worker = await this.workerPool.getWorker(blockRangeDefaultModeTaskPath);
      worker.onError(error => {
        log(error.message);
        this.workerPool.releaseWorker(worker.id);
      });
      worker.onMessage(async message => {
        if (message.isTaskResolved()) {
          // run timeout to check if there are more blocks to handle?
        } else {
          //
        }
        this._isIdle = true;
        this.workerPool.releaseWorker(message.workerId);
      });
      worker.run(data);
    }
  }
}
