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
    const worker = await this.workerPool.getWorker(blockRangeDefaultModeTaskPath);
    worker.onError(error => {
      log(error.message);
    });
    worker.run(data);
  }
}
