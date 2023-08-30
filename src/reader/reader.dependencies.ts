import { BroadcastClient } from '@alien-worlds/aw-broadcast';
import { BlockReader, Result } from '@alien-worlds/aw-core';
import { Dependencies } from '../common/dependencies';
import {
  BlockRangeScanner,
  BlockState,
  DatabaseConfigBuilder,
  UnprocessedBlockQueue,
} from '../common';
import { ReaderConfig } from './reader.config';

/**
 * An abstract class representing a reader dependencies.
 * @class ReaderDependencies
 */
export abstract class ReaderDependencies extends Dependencies {
  public broadcastClient: BroadcastClient;
  public blockState?: BlockState;
  public unprocessedBlockQueue?: UnprocessedBlockQueue;
  public blockReader?: BlockReader;
  public scanner?: BlockRangeScanner;
  public workerLoaderPath?: string;
  public workerLoaderDependenciesPath?: string;

  public databaseConfigBuilder: DatabaseConfigBuilder;

  public abstract initialize(config: ReaderConfig): Promise<Result>;
}
