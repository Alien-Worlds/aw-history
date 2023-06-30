import { Serializer } from '@alien-worlds/api-core';
import { ShipAbis } from '@alien-worlds/block-reader';
import { ProcessorTaskQueue } from '../common/processor-task-queue';
import { WorkerLoaderDependencies } from '@alien-worlds/workers';
import { Featured, FeaturedContractDataCriteria } from '../common/featured';
import { Abis } from '../common';
import { FilterConfig } from './filter.config';

/**
 * An abstract class representing a FilterWorkerLoader dependencies.
 * @class FilterWorkerLoaderDependencies
 */
export abstract class FilterWorkerLoaderDependencies extends WorkerLoaderDependencies {
  public processorTaskQueue: ProcessorTaskQueue;
  public abis: Abis;
  public shipAbis: ShipAbis;
  public featured: Featured;
  public serializer: Serializer;

  public abstract initialize(
    config: FilterConfig,
    featuredCriteriaPath: string
  ): Promise<void>;
}
