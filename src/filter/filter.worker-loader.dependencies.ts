import { Serializer } from '@alien-worlds/aw-core';
import { ProcessorTaskQueue } from '../common/processor-task-queue';
import { WorkerLoaderDependencies } from '@alien-worlds/aw-workers';
import { FeaturedContracts } from '../common/featured';
import { Abis } from '../common';
import { FilterConfig } from './filter.config';

/**
 * An abstract class representing a FilterWorkerLoader dependencies.
 * @class FilterWorkerLoaderDependencies
 */
export abstract class FilterWorkerLoaderDependencies extends WorkerLoaderDependencies {
  public processorTaskQueue: ProcessorTaskQueue;
  public abis: Abis;
  public featuredContracts: FeaturedContracts;
  public serializer: Serializer;

  public abstract initialize(
    config: FilterConfig,
    featuredCriteriaPath: string
  ): Promise<void>;
}
