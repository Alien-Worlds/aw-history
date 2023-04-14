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
import { ProcessorTaskQueue } from '../common/processor-task-queue';

export default class FilterWorkerLoader extends DefaultWorkerLoader {
  private featuredTraces: FeaturedTrace[];
  private featuredDeltas: FeaturedDelta[];
  private contractReader: ContractReader;
  private processorTaskQueue: ProcessorTaskQueue;
  private abis: Abis;

  public async setup(sharedData: FilterSharedData): Promise<void> {
    const {
      config: { mongo, featured, abis, contractReader, queue },
    } = sharedData;
    const { traces, deltas } = new FeaturedContractContent(featured).toJson();

    const mongoSource = await MongoSource.create(mongo);
    this.abis = await Abis.create(mongoSource, abis.service, featured);
    this.contractReader = await ContractReader.create(contractReader, mongoSource);
    this.processorTaskQueue = await ProcessorTaskQueue.create(mongoSource, true, queue);
    this.featuredDeltas = deltas;
    this.featuredTraces = traces;
  }

  public async load(pointer: string): Promise<Worker> {
    const { abis, contractReader, featuredTraces, featuredDeltas, processorTaskQueue } =
      this;
    return super.load(pointer, {
      abis,
      contractReader,
      featuredTraces,
      featuredDeltas,
      processorTaskQueue,
    });
  }
}
