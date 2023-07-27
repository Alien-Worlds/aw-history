import { UnknownObject } from '@alien-worlds/aw-core';
import { BroadcastConfig } from '@alien-worlds/aw-broadcast';
import { WorkersConfig } from '@alien-worlds/aw-workers';
import {
  AbisConfig,
  FeaturedConfig,
  ProcessorTaskQueueConfig,
  UnprocessedBlockQueueConfig,
} from '../common';

export type FilterConfig<DatabaseConfig = UnknownObject> = {
  mode: string;
  broadcast: BroadcastConfig;
  workers: WorkersConfig;
  featured: FeaturedConfig;
  abis: AbisConfig<DatabaseConfig>;
  database: DatabaseConfig;
  processorTaskQueue: ProcessorTaskQueueConfig;
  unprocessedBlockQueue: UnprocessedBlockQueueConfig;
  maxBytesSize?: number;
  batchSize?: number;
  [key: string]: unknown;
};
