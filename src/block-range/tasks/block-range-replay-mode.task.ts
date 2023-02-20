import { log, MongoSource } from '@alien-worlds/api-core';
import { ReceivedBlock, setupBlockReader } from '../../common/blockchain/block-reader';
import { Worker } from '../../common/workers/worker';
import {
  createDeltaProcessorTasks,
  createActionProcessorTasks,
} from './block-range-task.common';
import { Mode } from '../../common/common.enums';
import { setupProcessorTaskQueue } from '../../common/processor-task-queue';
import { BlockRangeTaskData } from '../../common/common.types';
import { setupAbis } from '../../common/abis';
import { setupBlockRangeScanner } from '../../common/block-range-scanner';
import { setupContractReader } from '../../common/blockchain/contract-reader';
import { Broadcast } from '../../common/broadcast';
import { BlockRangeSharedData } from '../block-range.types';
import { ProcessorQueueBroadcastMessages } from '../../internal-broadcast';

export default class BlockRangeReplayModeTask extends Worker {
  constructor(protected mongoSource: MongoSource, protected broadcast: Broadcast) {
    super();
  }

  public async run(
    data: BlockRangeTaskData,
    sharedData: BlockRangeSharedData
  ): Promise<void> {
    const { startBlock, endBlock, scanKey, mode } = data;
    const { mongoSource, broadcast } = this;
    const { config, featured } = sharedData;
    const {
      blockReader: { shouldFetchDeltas, shouldFetchTraces },
    } = config;
    const contractReader = await setupContractReader(config.contractReader, mongoSource);
    const blockReader = await setupBlockReader(config.blockReader);
    const processorQueue = await setupProcessorTaskQueue(mongoSource, true);
    const abis = await setupAbis(mongoSource, config.abis, config.featured);
    const scanner = await setupBlockRangeScanner(mongoSource, config.scanner);

    blockReader.onReceivedBlock(async (receivedBlock: ReceivedBlock) => {
      const {
        traces,
        deltas,
        block: { timestamp },
        thisBlock: { blockNumber },
      } = receivedBlock;
      const actionProcessorTasks = await createActionProcessorTasks(
        contractReader,
        abis,
        Mode.Replay,
        traces,
        featured.traces,
        blockNumber,
        timestamp
      );
      const deltaProcessorTasks = await createDeltaProcessorTasks(
        contractReader,
        abis,
        Mode.Replay,
        deltas,
        featured.deltas,
        blockNumber,
        timestamp
      );
      const tasks = [...actionProcessorTasks, ...deltaProcessorTasks];

      if (tasks.length > 0) {
        log(
          `Block #${blockNumber} contains ${actionProcessorTasks.length} actions and ${deltaProcessorTasks.length} deltas to process (${tasks.length} tasks in total).`
        );
        await processorQueue.addTasks(tasks);
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
