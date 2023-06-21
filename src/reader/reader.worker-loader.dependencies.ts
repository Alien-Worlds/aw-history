import { UnknownObject } from '@alien-worlds/api-core';
import { WorkerLoaderDependencies } from '@alien-worlds/workers';
import { BlockRangeScanner, BlockState, UnprocessedBlockQueue } from '../common';
import { BlockReader } from '@alien-worlds/block-reader';
import { ReaderConfig } from './reader.types';

/**
 * An abstract class representing a ReaderWorkerLoader dependencies.
 * @class ReaderWorkerLoaderDependencies
 */
export abstract class ReaderWorkerLoaderDependencies extends WorkerLoaderDependencies {
  public blockReader: BlockReader;
  public blockState: BlockState;
  public blockQueue: UnprocessedBlockQueue;
  public scanner: BlockRangeScanner;

  public abstract initialize(
    config: ReaderConfig,
    featuredJson: UnknownObject
  ): Promise<void>;
}
