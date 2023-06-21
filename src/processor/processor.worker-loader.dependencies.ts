import { UnknownObject, Serializer } from '@alien-worlds/api-core';
import { WorkerContainer, WorkerLoaderDependencies } from '@alien-worlds/workers';
import { ProcessorConfig } from './processor.types';

/**
 * An abstract class representing a ProcessorWorkerLoader dependencies.
 * @class ProcessorWorkerLoaderDependencies
 */
export abstract class ProcessorWorkerLoaderDependencies extends WorkerLoaderDependencies {
  public dataSource: unknown;
  public serializer: Serializer;
  public workers: WorkerContainer;

  public abstract initialize(
    config: ProcessorConfig,
    featuredJson: UnknownObject
  ): Promise<void>;
}
