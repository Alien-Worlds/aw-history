import { WorkersConfig } from '@alien-worlds/workers';
import { BroadcastConfig } from '@alien-worlds/broadcast';
import { AbisConfig, FeaturedConfig, ProcessorTaskQueueConfig } from '../common';
import { MongoConfig } from '@alien-worlds/storage-mongodb';
import { UnknownObject } from '@alien-worlds/api-core';

export type FilterSharedData = {
  config: FilterConfig;
  featuredJson: UnknownObject;
};

export type FilterCommandOptions = {
  threads: number;
  mode: string;
};

export type FilterConfig = {
  mode: string;
  broadcast: BroadcastConfig;
  workers: WorkersConfig;
  featured: FeaturedConfig;
  abis: AbisConfig;
  mongo: MongoConfig;
  queue: ProcessorTaskQueueConfig;
  [key: string]: unknown;
};

export type FilterAddons = {
  matchers?: unknown;
  [key: string]: unknown;
};
