import { WorkerLoaderDependencies } from '@alien-worlds/aw-workers';
import { ProcessorConfig } from './processor.config';

/**
 * An abstract class representing a ProcessorWorkerLoader dependencies.
 * @class ProcessorWorkerLoaderDependencies
 */
export abstract class ProcessorWorkerLoaderDependencies extends WorkerLoaderDependencies {
  public dataSource: unknown;
  public processorsPath: string;

  public abstract initialize(
    config: ProcessorConfig,
    processorsPath: string
  ): Promise<void>;
}
