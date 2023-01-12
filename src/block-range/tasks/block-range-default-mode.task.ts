import { Mode } from './../../common/common.enums';
import { setupBlockState } from '../../common/block-state';
import { ReceivedBlock, setupBlockReader } from '../../common/blockchain/block-reader';
import { WorkerTask } from '../../common/workers/worker-task';
import { FeaturedDelta, FeaturedTrace } from '../../common/featured';
import { BlockRangeConfig } from '../block-range.config';
import {
  createDeltaProcessorTasks,
  createActionProcessorTasks,
} from './block-range-task.common';
import { setupProcessorQueue } from '../../common/processor-queue';
import { BlockRangeTaskData } from '../../common/common.types';

type SharedData = {
  config: BlockRangeConfig;
  featured: { traces: FeaturedTrace[]; deltas: FeaturedDelta[] };
};

export default class BlockRangeDefaultModeTask extends WorkerTask {
  public use(): void {
    throw new Error('Method not implemented.');
  }

  public async run(data: BlockRangeTaskData, sharedData: SharedData): Promise<void> {
    const { startBlock, endBlock } = data;
    const { config, featured } = sharedData;
    const {
      reader: { shouldFetchDeltas, shouldFetchTraces },
      mongo,
    } = config;
    const blockReader = await setupBlockReader(config.reader);
    const blockState = await setupBlockState(mongo);
    const processorQueue = await setupProcessorQueue(mongo);
    const processorBroadcast = await setupProcessorBroadcast(config.broadcast);

    let currentBlock = startBlock;

    processorBroadcast.onReadyMessage(async () => {
      if (blockReader.hasFinished()) {
        currentBlock += 1n;
        blockReader.readOneBlock(currentBlock, {
          shouldFetchDeltas,
          shouldFetchTraces,
        });
      }
    });

    blockReader.onReceivedBlock(async (receivedBlock: ReceivedBlock) => {
      const {
        traces,
        deltas,
        block: { timestamp },
        thisBlock: { blockNumber },
      } = receivedBlock;
      const state = await blockState.getState();
      const actionProcessorTasks = await createActionProcessorTasks(
        Mode.Default,
        traces,
        featured.traces,
        blockNumber,
        timestamp
      );
      const deltaProcessorTasks = await createDeltaProcessorTasks(
        Mode.Default,
        deltas,
        featured.deltas,
        blockNumber,
        timestamp
      );

      if (blockNumber > state.blockNumber) {
        blockState.newState(blockNumber);
      }

      await processorQueue.addTasks([...actionProcessorTasks, ...deltaProcessorTasks]);
    });

    blockReader.onError(error => {
      this.reject(error);
    });

    blockReader.onComplete(() => {
      if (currentBlock < endBlock) {
        processorBroadcast.sendIsProcessorReadyMessage();
      } else {
        this.resolve({ startBlock, endBlock });
      }
    });

    blockReader.readOneBlock(currentBlock, {
      shouldFetchDeltas,
      shouldFetchTraces,
    });
  }
}
