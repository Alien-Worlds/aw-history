import { MongoConfig } from '@alien-worlds/api-core';
import { AbisServiceConfig } from '../common/abis';
import { FeaturedConfig } from '../common/featured';
import { WorkersConfig } from '../common/workers';

export type ProcessorConfig = {
  broadcast: {
    url: string;
  };
  workers: WorkersConfig;
  featured: FeaturedConfig;
  abis: AbisServiceConfig;
  mongo: MongoConfig;
  sharedData?: unknown
};
