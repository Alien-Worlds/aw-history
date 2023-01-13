import { MongoConfig } from '@alien-worlds/api-core';
import { BroadcastConfig } from '../common/broadcast';
import { FeaturedConfig, FeaturedMatchers } from '../common/featured';
import { WorkersConfig } from '../common/workers';

export type ProcessorConfig = {
  broadcast: BroadcastConfig;
  workers: WorkersConfig;
  featured: FeaturedConfig;
  mongo: MongoConfig;
  sharedData?: unknown;
  intervalDelay?: number;
};

export type ProcessorAddons = {
  matchers?: FeaturedMatchers;
  [key: string]: unknown;
};
