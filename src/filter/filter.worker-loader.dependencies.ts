import { UnknownObject, Serializer } from '@alien-worlds/api-core';
import { FilterConfig } from './filter.types';
import { WorkerLoaderDependencies } from '@alien-worlds/workers';
import { Abis, Featured, ProcessorTaskQueue } from '../common';
import { ShipAbis } from '@alien-worlds/block-reader';

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
    featuredJson: UnknownObject
  ): Promise<void>;
}
