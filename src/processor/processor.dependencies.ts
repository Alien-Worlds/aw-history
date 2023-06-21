import { Result } from '@alien-worlds/api-core';
import { Dependencies } from '../common/dependencies';
import { BroadcastClient } from '@alien-worlds/broadcast';
import { WorkerPool } from '@alien-worlds/workers';
import { ProcessorConfig } from './processor.types';

/**
 * An abstract class representing a Processor dependencies.
 * @class ProcessorDependencies
 */
export abstract class ProcessorDependencies extends Dependencies {
  /**
   * The broadcast client used for communication.
   * @type {BroadcastClient}
   */
  public broadcastClient: BroadcastClient;

  public workerPool: WorkerPool;

  public abstract initialize(config: ProcessorConfig): Promise<Result>;
}
