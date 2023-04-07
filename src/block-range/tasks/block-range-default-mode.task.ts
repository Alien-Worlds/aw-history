import { log, MongoSource, BroadcastClient, parseToBigInt } from '@alien-worlds/api-core';
import { Mode } from './../../common/common.enums';
import { setupBlockState } from '../../common/block-state';
import { BlockReader, ReceivedBlock } from '../../common/blockchain/block-reader';
import { Worker } from '../../common/workers/worker';
import {
  createDeltaProcessorTasks,
  createActionProcessorTasks,
} from './block-range-task.common';
import { ProcessorTaskQueue } from '../../common/processor-task-queue';
import { BlockRangeTaskData } from '../../common/common.types';
import { ProcessorQueueBroadcastMessages } from '../../internal-broadcast/messages/processor-queue-broadcast.messages';
import { ContractReader } from '../../common/blockchain/contract-reader';
import { BlockRangeSharedData } from '../block-range.types';
import { Abis } from '../../common/abis';

export default class BlockRangeDefaultModeTask extends Worker {
  constructor(
    protected mongoSource: MongoSource,
    protected broadcast: BroadcastClient,
    protected abis: Abis,
    protected blockReader: BlockReader,
    protected contractReader: ContractReader,
    protected processorQueue: ProcessorTaskQueue
  ) {
    super();
  }

  public async run(
    data: BlockRangeTaskData,
    sharedData: BlockRangeSharedData
  ): Promise<void> {
    const { mongoSource, broadcast, abis, blockReader, contractReader, processorQueue } =
      this;
    const { startBlock, endBlock } = data;
    const { config, featured } = sharedData;
    const {
      blockReader: { shouldFetchDeltas, shouldFetchTraces },
    } = config;

    const blockState = await setupBlockState(mongoSource);

    blockReader.onReceivedBlock(async (receivedBlock: ReceivedBlock) => {
      const {
        traces,
        deltas,
        block: { timestamp },
        thisBlock: { blockNumber },
      } = receivedBlock;

      const state = await blockState.getState();
      const isMicroFork = blockNumber <= state.blockNumber;

      const [actionProcessorTasks, deltaProcessorTasks] = await Promise.all([
        createActionProcessorTasks(
          contractReader,
          abis,
          Mode.Default,
          traces,
          featured.traces,
          blockNumber,
          timestamp,
          isMicroFork
        ),
        createDeltaProcessorTasks(
          contractReader,
          abis,
          Mode.Default,
          deltas,
          featured.deltas,
          blockNumber,
          timestamp,
          isMicroFork
        ),
      ]);

      const tasks = [...actionProcessorTasks, ...deltaProcessorTasks];

      // mark this block as a new state only if its index is not lower than the current state
      // and if it contains tasks (block number <= last irreversible block)
      if (blockNumber > state.blockNumber && tasks.length > 0) {
        blockState.newState(blockNumber);
      }

      if (tasks.length > 0) {
        log(
          `Block #${startBlock} contains ${actionProcessorTasks.length} actions and ${deltaProcessorTasks.length} deltas to process (${tasks.length} tasks in total).`
        );
        processorQueue.addTasks(tasks);
      } else {
        log(
          `The block (${blockNumber}) does not contain actions and deltas that could be processed.`
        );
      }
      broadcast.sendMessage(ProcessorQueueBroadcastMessages.createUpdateMessage());
    });

    blockReader.onError(error => {
      this.reject(error);
    });

    blockReader.onComplete(async () => {
      this.resolve({ startBlock, endBlock });
    });

    // start reading blockchain
    blockReader.readBlocks(startBlock, parseToBigInt(Number.MAX_SAFE_INTEGER), {
      shouldFetchDeltas,
      shouldFetchTraces,
    });
  }
}
