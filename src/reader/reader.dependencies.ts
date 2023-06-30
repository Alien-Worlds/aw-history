import { BroadcastClient } from '@alien-worlds/broadcast';
import { Result } from '@alien-worlds/api-core';
import { Dependencies } from '../common/dependencies';
import { BlockRangeScanner, DatabaseConfigBuilder } from '../common';
import { ReaderConfig } from './reader.config';

/**
 * An abstract class representing a reader dependencies.
 * @class ReaderDependencies
 */
export abstract class ReaderDependencies extends Dependencies {
  public broadcastClient: BroadcastClient;
  public scanner: BlockRangeScanner;
  public workerLoaderPath?: string;
  public workerLoaderDependenciesPath: string;

  public databaseConfigBuilder: DatabaseConfigBuilder;

  public abstract initialize(config: ReaderConfig): Promise<Result>;
}
