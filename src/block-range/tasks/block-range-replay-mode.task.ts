import { BroadcastClient, log, MongoSource } from '@alien-worlds/api-core';
import { BlockReader, ReceivedBlock } from '../../common/blockchain/block-reader';
import { Worker } from '../../common/workers/worker';
import {
  createDeltaProcessorTasks,
  createActionProcessorTasks,
} from './block-range-task.common';
import { Mode } from '../../common/common.enums';
import { ProcessorTaskQueue } from '../../common/processor-task-queue';
import { BlockRangeTaskData } from '../../common/common.types';
import { setupBlockRangeScanner } from '../../common/block-range-scanner';
import { ContractReader } from '../../common/blockchain/contract-reader';
import { BlockRangeSharedData } from '../block-range.types';
import { ProcessorQueueBroadcastMessages } from '../../internal-broadcast';
import { Abis } from '../../common/abis';

export default class BlockRangeReplayModeTask extends Worker {
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
    const { startBlock, endBlock, scanKey, mode } = data;
    const { mongoSource, broadcast, abis, blockReader, contractReader, processorQueue } =
      this;
    const { config, featured } = sharedData;
    const {
      blockReader: { shouldFetchDeltas, shouldFetchTraces },
    } = config;

    const scanner = await setupBlockRangeScanner(mongoSource, config.scanner);

    blockReader.onReceivedBlock(async (receivedBlock: ReceivedBlock) => {
      const {
        traces,
        deltas,
        block: { timestamp },
        thisBlock: { blockNumber },
      } = receivedBlock;

      const [actionProcessorTasks, deltaProcessorTasks] = await Promise.all([
        createActionProcessorTasks(
          contractReader,
          abis,
          Mode.Replay,
          traces,
          featured.traces,
          blockNumber,
          timestamp,
          false
        ),
        createDeltaProcessorTasks(
          contractReader,
          abis,
          Mode.Replay,
          deltas,
          featured.deltas,
          blockNumber,
          timestamp,
          false
        ),
      ]);
      const tasks = [...actionProcessorTasks, ...deltaProcessorTasks];

      if (tasks.length > 0) {
        log(
          `Block #${blockNumber} contains ${actionProcessorTasks.length} actions and ${deltaProcessorTasks.length} deltas to process (${tasks.length} tasks in total).`
        );
        processorQueue.addTasks(tasks);
      } else {
        log(
          `The block (${blockNumber}) does not contain actions and deltas that could be processed.`
        );
      }

      broadcast.sendMessage(ProcessorQueueBroadcastMessages.createUpdateMessage());

      //
      await scanner.updateScanProgress(scanKey, blockNumber);
    });

    blockReader.onError(error => {
      this.reject(error);
    });

    blockReader.onComplete(async () => {
      this.resolve({ startBlock, endBlock, scanKey, mode });
    });

    blockReader.readBlocks(startBlock, endBlock, {
      shouldFetchDeltas,
      shouldFetchTraces,
    });
  }
}
