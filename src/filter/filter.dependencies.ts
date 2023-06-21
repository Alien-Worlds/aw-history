import { Result, Serializer } from '@alien-worlds/api-core';
import { Dependencies } from '../common/dependencies';
import { FilterConfig } from './filter.types';
import { BroadcastClient } from '@alien-worlds/broadcast';
import { WorkerPool } from '@alien-worlds/workers';
import { UnprocessedBlockQueue } from '../common';

/**
 * An abstract class representing a Filter dependencies.
 * @class FilterDependencies
 */
export abstract class FilterDependencies extends Dependencies {
  /**
   * The broadcast client used for communication.
   * @type {BroadcastClient}
   */
  public broadcastClient: BroadcastClient;

  public workerPool: WorkerPool;
  public unprocessedBlockQueue: UnprocessedBlockQueue;
  public serializer: Serializer;

  public abstract initialize(config: FilterConfig): Promise<Result>;
}
