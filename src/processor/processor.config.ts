import { BroadcastConfig } from '@alien-worlds/aw-broadcast';
import { WorkersConfig } from '@alien-worlds/aw-workers';
import { FeaturedConfig, ProcessorMatcher, ProcessorTaskQueueConfig } from '../common';
import { UnknownObject } from '@alien-worlds/aw-core';

export type ProcessorConfig<DatabaseConfig = UnknownObject> = {
  broadcast: BroadcastConfig;
  workers: WorkersConfig;
  featured: FeaturedConfig;
  database: DatabaseConfig;
  queue: ProcessorTaskQueueConfig;
  processorLoaderPath?: string;
  [key: string]: unknown;
};

export type ProcessorAddons = {
  matchers?: {
    traces?: ProcessorMatcher;
    deltas?: ProcessorMatcher;
    [key: string]: ProcessorMatcher;
  };
  [key: string]: unknown;
};
