import { WorkerLoaderDependencies } from '@alien-worlds/workers';
import { BlockReader } from '@alien-worlds/block-reader';
import { UnprocessedBlockQueue } from '../common/unprocessed-block-queue';
import { BlockRangeScanner, BlockState } from '../common';
import { ReaderConfig } from './reader.config';

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
