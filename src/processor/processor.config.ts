import { MongoConfig } from '@alien-worlds/api-core';
import { AbisServiceConfig } from '../common/abis';
import { FeaturedConfig } from '../common/featured';

export type ProcessorConfig = {
  broadcast: {
    url: string;
  };
  threads: number;
  featured: FeaturedConfig;
  abis: AbisServiceConfig;
  mongo: MongoConfig;
};
