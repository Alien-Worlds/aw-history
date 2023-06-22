import { BroadcastClient } from '@alien-worlds/broadcast';
import { Dependencies } from '../common/dependencies';
import { WorkerPool } from '@alien-worlds/workers';
import { ReaderConfig } from './reader.types';
import { Result } from '@alien-worlds/api-core';
import { BlockRangeScanner } from '../common';

/**
 * An abstract class representing a reader dependencies.
 * @class ReaderDependencies
 */
export abstract class ReaderDependencies extends Dependencies {
  public broadcastClient: BroadcastClient;
  public scanner: BlockRangeScanner;
  public workerPool: WorkerPool;

  public abstract initialize(config: ReaderConfig): Promise<Result>;
}
