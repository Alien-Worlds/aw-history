import { Serializer } from '@alien-worlds/api-core';
import { WorkerLoaderDependencies } from '@alien-worlds/workers';
import { ProcessorConfig } from './processor.config';

/**
 * An abstract class representing a ProcessorWorkerLoader dependencies.
 * @class ProcessorWorkerLoaderDependencies
 */
export abstract class ProcessorWorkerLoaderDependencies extends WorkerLoaderDependencies {
  public dataSource: unknown;
  public serializer: Serializer;
  public processorsPath: string;

  public abstract initialize(
    config: ProcessorConfig,
    processorsPath: string
  ): Promise<void>;
}
