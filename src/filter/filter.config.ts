import { UnknownObject } from '@alien-worlds/api-core';
import { BroadcastConfig } from '@alien-worlds/broadcast';
import { WorkersConfig } from '@alien-worlds/workers';
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
