import { MongoConfig, BroadcastConfig } from '@alien-worlds/api-core';
import { FeaturedConfig, FeaturedMatchers } from '../common/featured';
import { ProcessorTaskQueueConfig } from '../common/processor-task-queue/processor-task-queue.config';
import { WorkersConfig } from '../common/workers';

export type ProcessorCommandOptions = {
  threads: number;
};

export type ProcessorConfig = {
  broadcast: BroadcastConfig;
  workers: WorkersConfig;
  featured: FeaturedConfig;
  mongo: MongoConfig;
  queue: ProcessorTaskQueueConfig;
  processorLoaderPath?: string;
  [key: string]: unknown;
};

export type ProcessorAddons = {
  matchers?: FeaturedMatchers;
  [key: string]: unknown;
};

export type ProcessorSharedData = {
  config: ProcessorConfig;
};
