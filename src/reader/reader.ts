import { log, MongoSource, parseToBigInt } from '@alien-worlds/api-core';
import { BlockRangeScanner, setupBlockRangeScanner } from '../common/block-range-scanner';
import { Mode } from '../common/common.enums';
import { BlockRangeTaskData } from '../common/common.types';
import { WorkerMessage, WorkerPool } from '../common/workers';
import ReaderWorker from './reader.worker';
import { BlockJson } from '../common/blockchain/block-reader';
import { Block, BlockRepository } from './blocks';
import { ReaderConfig } from './reader.config';
import { BlockState } from '../common/block-state';

export class Reader {
  public static async create(config: ReaderConfig): Promise<Reader> {
    const mongoSource = await MongoSource.create(config.mongo);
    const scanner = await setupBlockRangeScanner(mongoSource, config.scanner);
    const blockState = await BlockState.create(mongoSource);
    const blockRepository = await BlockRepository.create(mongoSource);
    const workerPool = await WorkerPool.create<ReaderWorker>({
      threadsCount: config.workers?.threadsCount || 1,
      sharedData: { config },
      defaultWorkerPath: `${__dirname}/block-range-reader.worker`,
      workerLoaderPath: `${__dirname}/block-range-reader.worker-loader`,
    });

    return new Reader(workerPool, config.mode, scanner, blockRepository, blockState);
  }

  private loop = false;
  private scanKey: string;

  protected constructor(
    private workerPool: WorkerPool<ReaderWorker>,
    private mode: string,
    private scanner: BlockRangeScanner,
    private blocks: BlockRepository,
    private blockState: BlockState
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

  private async handleDefaultModeWorkerMessage(message: WorkerMessage<BlockJson>) {
    const { workerPool, blocks, blockState } = this;

    if (message.isTaskResolved || message.isTaskRejected) {
      workerPool.releaseWorker(message.workerId);
    } else if (message.isTaskProgress) {
      const currentBlockNumber = await blockState.getBlockNumber();
      message.data.is_micro_fork =
        currentBlockNumber > parseToBigInt(message.data.this_block.block_num);
      const { content: addedBlockNumbers } = await blocks.addBlock(
        Block.fromJson(message.data)
      );
      if (Array.isArray(addedBlockNumbers) && addedBlockNumbers.length > 0) {
        const max = addedBlockNumbers.reduce((max, current) => {
          return max < current ? current : max;
        }, 0n);
        blockState.updateBlockNumber(max);
      }
    }
  }

  private async handleReplayModeWorkerMessage(message: WorkerMessage<BlockJson>) {
    const { scanner, workerPool, scanKey, blocks } = this;
    const { data } = message;

    if (message.isTaskResolved) {
      await scanner.updateScanProgress(scanKey, parseToBigInt(data.this_block.block_num));
      workerPool.releaseWorker(message.workerId, data);
    } else if (message.isTaskProgress) {
      blocks.addBlock(Block.fromJson(message.data));
    }
  }

  private async handleWorkerError(id: number, error: Error) {
    log(error);
    this.workerPool.releaseWorker(id);
  }

  public async read(task: BlockRangeTaskData) {
    if (this.loop) {
      return;
    }

    const { mode, scanKey, startBlock, endBlock } = task;
    this.loop = true;
    this.scanKey = scanKey;

    while (this.loop) {
      const worker = await this.workerPool.getWorker();
      if (worker) {
        if (mode === Mode.Default || mode === Mode.Test) {
          worker.onMessage(this.handleDefaultModeWorkerMessage);
          worker.onError(this.handleWorkerError);
          worker.run(startBlock, endBlock);
        } else if (mode === Mode.Replay) {
          const scan = await this.scanner.getNextScanNode(scanKey);
          if (scan) {
            worker.onMessage(this.handleReplayModeWorkerMessage);
            worker.onError(this.handleWorkerError);
            worker.run(scan.start, scan.end);
          }
        } else {
          //unknown mode
        }
      } else {
        this.loop = false;
      }
    }
  }
}
