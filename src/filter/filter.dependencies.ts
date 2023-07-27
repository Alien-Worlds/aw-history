import { Result } from '@alien-worlds/aw-core';
import { BroadcastClient } from '@alien-worlds/aw-broadcast';
import { UnprocessedBlockQueue } from '../common/unprocessed-block-queue';
import { Dependencies } from '../common/dependencies';
import { FilterConfig } from './filter.config';
import { DatabaseConfigBuilder } from '../common';
import { FilterAddons } from './filter.types';

/**
 * An abstract class representing a Filter dependencies.
 * @class FilterDependencies
 */
export abstract class FilterDependencies<
  UnprocessedBlockModel = unknown
> extends Dependencies {
  public broadcastClient: BroadcastClient;
  public unprocessedBlockQueue: UnprocessedBlockQueue<UnprocessedBlockModel>;
  public workerLoaderPath?: string;
  public workerLoaderDependenciesPath: string;

  public databaseConfigBuilder: DatabaseConfigBuilder;

  public abstract initialize(
    config: FilterConfig,
    addons?: FilterAddons
  ): Promise<Result>;
}
