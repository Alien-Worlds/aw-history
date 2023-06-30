import { BroadcastConfig } from '@alien-worlds/broadcast';
import { WorkersConfig } from '@alien-worlds/workers';
import { FeaturedConfig, ProcessorMatcher, ProcessorTaskQueueConfig } from '../common';
import { UnknownObject } from '@alien-worlds/api-core';

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
