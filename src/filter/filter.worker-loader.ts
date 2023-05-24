import { MongoSource } from '@alien-worlds/api-core';
import { Worker } from '../common/workers';
import { DefaultWorkerLoader } from '../common/workers/worker-loader';
import { FilterSharedData } from './filter.types';
import {
  FeaturedContractContent,
  FeaturedDelta,
  FeaturedTrace,
} from '../common/featured';
import { ContractReader } from '../common/blockchain';
import { Abis } from '../common/abis';
import { ProcessorTaskQueue } from '../processor/processor-task-queue';
import FilterWorker from './filter.worker';
import { ShipAbis } from '../common/ship/ship-abis';

export default class FilterWorkerLoader extends DefaultWorkerLoader<FilterSharedData> {
  private featuredTraces: FeaturedTrace[];
  private featuredDeltas: FeaturedDelta[];
  private contractReader: ContractReader;
  private processorTaskQueue: ProcessorTaskQueue;
  private abis: Abis;
  private shipAbis: ShipAbis;

  public async setup(sharedData: FilterSharedData): Promise<void> {
    super.setup(sharedData);
    const {
      config: { mongo, featured, abis, contractReader, queue },
    } = sharedData;
    const { traces, deltas } = new FeaturedContractContent(featured).toJson();

    const mongoSource = await MongoSource.create(mongo);
    this.abis = await Abis.create(mongoSource, abis.service, featured);
    this.contractReader = await ContractReader.create(contractReader, mongoSource);
    this.processorTaskQueue = await ProcessorTaskQueue.create(mongoSource, true, queue);
    this.shipAbis = await ShipAbis.create(mongoSource);
    this.featuredDeltas = deltas;
    this.featuredTraces = traces;
  }

  public async load(): Promise<Worker> {
    const {
      abis,
      shipAbis,
      contractReader,
      featuredTraces,
      featuredDeltas,
      processorTaskQueue,
      sharedData,
    } = this;
    return new FilterWorker(
      {
        shipAbis,
        abis,
        contractReader,
        featuredTraces,
        featuredDeltas,
        processorTaskQueue,
      },
      sharedData
    );
  }
}
