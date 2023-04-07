import { Broadcast, BroadcastClient, MongoSource } from '@alien-worlds/api-core';
import { Abis, setupAbis } from '../common/abis';
import {
  BlockReader,
  ContractReader,
  setupBlockReader,
  setupContractReader,
} from '../common/blockchain';
import { Mode } from '../common/common.enums';
import {
  ProcessorTaskQueue,
  setupProcessorTaskQueue,
} from '../common/processor-task-queue';
import { Worker } from '../common/workers';
import { DefaultWorkerLoader } from '../common/workers/worker-loader';
import { InternalBroadcastClientName } from '../internal-broadcast';
import { BlockRangeSharedData } from './block-range.types';

export default class BlockRangeWorkerLoader extends DefaultWorkerLoader {
  private mongoSource: MongoSource;
  private broadcast: BroadcastClient;
  private blockReader: BlockReader;
  private contractReader: ContractReader;
  private processorQueue: ProcessorTaskQueue;
  private abis: Abis;

  public async setup(sharedData: BlockRangeSharedData): Promise<void> {
    const {
      config: { mongo, broadcast, mode, abis, featured, blockReader, contractReader },
    } = sharedData;
    this.mongoSource = await MongoSource.create(mongo);
    this.broadcast = await Broadcast.createClient({
      ...broadcast,
      clientName:
        mode === Mode.Replay
          ? InternalBroadcastClientName.BlockRangeReplayModeTask
          : InternalBroadcastClientName.BlockRangeDefaultModeTask,
    });
    this.abis = await setupAbis(this.mongoSource, abis, featured, true);
    this.contractReader = await setupContractReader(contractReader, this.mongoSource);
    this.blockReader = await setupBlockReader(blockReader);
    this.processorQueue = await setupProcessorTaskQueue(this.mongoSource, true);
  }

  public async load(pointer: string, containerPath: string): Promise<Worker> {
    const { mongoSource, broadcast, abis, blockReader, contractReader, processorQueue } =
      this;
    return super.load(
      pointer,
      containerPath,
      mongoSource,
      broadcast,
      abis,
      blockReader,
      contractReader,
      processorQueue
    );
  }
}
