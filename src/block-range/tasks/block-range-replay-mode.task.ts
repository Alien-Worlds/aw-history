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
import { connectMongo, log, MongoSource } from '@alien-worlds/api-core';
import { setupBlockRangeScanner } from '../../common/block-range-scanner';
import { setupContractReader } from '../../common/blockchain/contract-reader';

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
      blockReader: { shouldFetchDeltas, shouldFetchTraces },
    } = config;
    const db = await connectMongo(config.mongo);
    const mongo = new MongoSource(db);
    const contractReader = await setupContractReader(config.contractReader, mongo);
    const blockReader = await setupBlockReader(config.blockReader);
    const processorQueue = await setupProcessorQueue(mongo);
    const abis = await setupAbis(mongo, config.abis, config.featured);
    const scanner = await setupBlockRangeScanner(mongo, config.scanner);

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
      //
      await scanner.updateScanProgress(scanKey, blockNumber);
    });
    blockReader.onError(error => {
      this.reject(error);
    });
    blockReader.onComplete(async () => {
      this.resolve({ startBlock, endBlock, scanKey });
    });

    blockReader.readBlocks(startBlock, endBlock, {
      shouldFetchDeltas,
      shouldFetchTraces,
    });
  }
}
