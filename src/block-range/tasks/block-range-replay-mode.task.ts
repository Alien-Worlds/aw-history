/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { log } from '@alien-worlds/api-core';
import { ReceivedBlock, setupBlockReader } from '../../common/blockchain/block-reader';
import { WorkerTask } from '../../common/workers/worker-task';
import { setupProcessorBroadcast } from '../../processor/broadcast/processor.broadcast';
import { BlockRangeTaskMessageContent } from '../broadcast/block-range-task.message-content';
import { FeaturedDelta, FeaturedTrace } from '../../common/featured';
import { BlockRangeConfig } from '../block-range.config';
import {
  createDeltaProcessorTasks,
  createActionProcessorTasks,
} from './block-range-task.common';
import { Mode } from '../../common/common.enums';
import { setupProcessorQueue } from '../../common/processor-queue';

type SharedData = {
  config: BlockRangeConfig;
  featured: { traces: FeaturedTrace[]; deltas: FeaturedDelta[] };
};

export default class BlockRangeReplayModeTask extends WorkerTask {
  public use(): void {
    throw new Error('Method not implemented.');
  }

  public async run(
    data: BlockRangeTaskMessageContent,
    sharedData: SharedData
  ): Promise<void> {
    const { startBlock, endBlock, scanKey } = data;
    const { config, featured } = sharedData;
    const { reader, mongo } = config;
    const { shouldFetchDeltas, shouldFetchTraces } = reader;
    const blockReader = await setupBlockReader(reader);
    const processorQueue = await setupProcessorQueue(mongo);

    blockReader.onReceivedBlock(async (receivedBlock: ReceivedBlock) => {
      const {
        traces,
        deltas,
        block: { timestamp },
        thisBlock: { blockNumber },
      } = receivedBlock;
      const actionProcessorTasks = await createActionProcessorTasks(
        Mode.Replay,
        traces,
        featured.traces,
        blockNumber,
        timestamp
      );
      const deltaProcessorTasks = await createDeltaProcessorTasks(
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
