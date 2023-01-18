import { connectMongo, log, MongoSource } from '@alien-worlds/api-core';
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
import { ProcessorQueueBroadcastMessages } from '../../internal-broadcast/messages/processor-queue-broadcast.messages';
import { InternalBroadcastClientName } from '../../internal-broadcast';
import { startBroadcastClient } from '../../common/broadcast';
import { setupContractReader } from '../../common/blockchain/contract-reader';

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
      blockReader: { shouldFetchDeltas, shouldFetchTraces },
    } = config;
    const db = await connectMongo(config.mongo);
    const mongo = new MongoSource(db);
    const contractReader = await setupContractReader(config.contractReader, mongo);
    const blockReader = await setupBlockReader(config.blockReader);
    const blockState = await setupBlockState(mongo);
    const processorQueue = await setupProcessorQueue(mongo);
    const broadcast = await startBroadcastClient(
      InternalBroadcastClientName.BlockRangeDefaultModeTask,
      config.broadcast
    );
    const abis = await setupAbis(mongo, config.abis, config.featured);
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
        contractReader,
        abis,
        Mode.Default,
        traces,
        featured.traces,
        blockNumber,
        timestamp
      );
      const deltaProcessorTasks = await createDeltaProcessorTasks(
        contractReader,
        abis,
        Mode.Default,
        deltas,
        featured.deltas,
        blockNumber,
        timestamp
      );
      const tasks = [...actionProcessorTasks, ...deltaProcessorTasks];

      // mark this block as a new state only if its index is not lower than the current state
      // and if it contains tasks (block number <= last irreversible block)
      if (blockNumber > state.blockNumber && tasks.length > 0) {
        blockState.newState(blockNumber);
      }

      if (tasks.length > 0) {
        log(
          `Block #${currentBlock} contains ${actionProcessorTasks.length} actions and ${deltaProcessorTasks.length} deltas to process (${tasks.length} tasks in total).`
        );
        await processorQueue.addTasks(tasks);
      } else {
        log(
          `The block (${blockNumber}) does not contain actions and deltas that could be processed.`
        );
      }
    });

    blockReader.onError(error => {
      this.reject(error);
    });

    blockReader.onComplete(async () => {
      //

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
