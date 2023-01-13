import { ReceivedBlock, setupBlockReader } from '../../common/blockchain/block-reader';
import { Worker } from '../../common/workers/worker';
import { FeaturedDelta, FeaturedTrace } from '../../common/featured';
import { BlockRangeConfig } from '../block-range.config';
import {
  createDeltaProcessorTasks,
  createActionProcessorTasks,
} from './block-range-task.common';
import { Mode } from '../../common/common.enums';
import { setupProcessorQueue } from '../../common/processor-queue';
import { BlockRangeTaskData } from '../../common/common.types';
import { setupAbis } from '../../common/abis';

type SharedData = {
  config: BlockRangeConfig;
  featured: { traces: FeaturedTrace[]; deltas: FeaturedDelta[] };
};

export default class BlockRangeReplayModeTask extends Worker {
  public use(): void {
    throw new Error('Method not implemented.');
  }

  public async run(data: BlockRangeTaskData, sharedData: SharedData): Promise<void> {
    const { startBlock, endBlock, scanKey } = data;
    const { config, featured } = sharedData;
    const {
      reader: { shouldFetchDeltas, shouldFetchTraces },
    } = config;
    const blockReader = await setupBlockReader(config.reader);
    const processorQueue = await setupProcessorQueue(config.mongo);
    const abis = await setupAbis(config.mongo, config.abis, config.featured);

    blockReader.onReceivedBlock(async (receivedBlock: ReceivedBlock) => {
      const {
        traces,
        deltas,
        block: { timestamp },
        thisBlock: { blockNumber },
      } = receivedBlock;
      const actionProcessorTasks = await createActionProcessorTasks(
        abis,
        Mode.Replay,
        traces,
        featured.traces,
        blockNumber,
        timestamp
      );
      const deltaProcessorTasks = await createDeltaProcessorTasks(
        abis,
        Mode.Replay,
        deltas,
        featured.deltas,
        blockNumber,
        timestamp
      );

      await processorQueue.addTasks([...actionProcessorTasks, ...deltaProcessorTasks]);
    });
    blockReader.onError(error => {
      this.reject(error);
    });
    blockReader.onComplete(() => {
      this.resolve({ startBlock, endBlock, scanKey });
    });

    blockReader.readBlocks(startBlock, endBlock, {
      shouldFetchDeltas,
      shouldFetchTraces,
    });
  }
}
