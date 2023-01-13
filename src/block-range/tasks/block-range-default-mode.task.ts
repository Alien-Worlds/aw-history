import { Mode } from './../../common/common.enums';
import { setupBlockState } from '../../common/block-state';
import { ReceivedBlock, setupBlockReader } from '../../common/blockchain/block-reader';
import { Worker } from '../../common/workers/worker';
import { FeaturedDelta, FeaturedTrace } from '../../common/featured';
import { BlockRangeConfig } from '../block-range.config';
import {
  createDeltaProcessorTasks,
  createActionProcessorTasks,
} from './block-range-task.common';
import { setupProcessorQueue } from '../../common/processor-queue';
import { BlockRangeTaskData } from '../../common/common.types';
import { setupAbis } from '../../common/abis';
import { startBlockRangeBroadcastClient } from '../block-range.broadcast';
import { ProcessorQueueBroadcastMessages } from '../../internal-broadcast/messages/processor-queue-broadcast.messages';

type SharedData = {
  config: BlockRangeConfig;
  featured: { traces: FeaturedTrace[]; deltas: FeaturedDelta[] };
};

export default class BlockRangeDefaultModeTask extends Worker {
  public use(): void {
    throw new Error('Method not implemented.');
  }

  public async run(data: BlockRangeTaskData, sharedData: SharedData): Promise<void> {
    const { startBlock, endBlock } = data;
    const { config, featured } = sharedData;
    const {
      reader: { shouldFetchDeltas, shouldFetchTraces },
    } = config;
    const blockReader = await setupBlockReader(config.reader);
    const blockState = await setupBlockState(config.mongo);
    const processorQueue = await setupProcessorQueue(config.mongo);
    const broadcast = await startBlockRangeBroadcastClient(config.broadcast);
    const abis = await setupAbis(config.mongo, config.abis, config.featured);
    let currentBlock = startBlock;

    blockReader.onReceivedBlock(async (receivedBlock: ReceivedBlock) => {
      const {
        traces,
        deltas,
        block: { timestamp },
        thisBlock: { blockNumber },
      } = receivedBlock;

      const state = await blockState.getState();
      const actionProcessorTasks = await createActionProcessorTasks(
        abis,
        Mode.Default,
        traces,
        featured.traces,
        blockNumber,
        timestamp
      );
      const deltaProcessorTasks = await createDeltaProcessorTasks(
        abis,
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
        // notify Processor that new tasks have been added to the queue
        broadcast.sendMessage(ProcessorQueueBroadcastMessages.createUpdateMessage());
        // read next block
        currentBlock += 1n;
        blockReader.readOneBlock(currentBlock, {
          shouldFetchDeltas,
          shouldFetchTraces,
        });
      } else {
        this.resolve({ startBlock, endBlock });
      }
    });

    // start reading blockchain
    blockReader.readOneBlock(currentBlock, {
      shouldFetchDeltas,
      shouldFetchTraces,
    });
  }
}
