import { WorkerLoaderDependencies } from '@alien-worlds/aw-workers';
import { UnprocessedBlockQueue } from '../common/unprocessed-block-queue';
import { BlockRangeScanner, BlockState } from '../common';
import { ReaderConfig } from './reader.config';
import { BlockReader } from '@alien-worlds/aw-core';

/**
 * An abstract class representing a ReaderWorkerLoader dependencies.
 * @class ReaderWorkerLoaderDependencies
 */
export abstract class ReaderWorkerLoaderDependencies extends WorkerLoaderDependencies {
  public blockReader: BlockReader;
  public blockState: BlockState;
  public blockQueue: UnprocessedBlockQueue;
  public scanner: BlockRangeScanner;
  public config: ReaderConfig;

  public abstract initialize(config: ReaderConfig): Promise<void>;
}
