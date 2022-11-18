import { Long, MongoConfig } from '@alien-worlds/api-core';
import { FeaturedConfig } from '../featured';

export type AbiJson = {
  blockNumber: bigint;
  contract: string;
  hex: string;
};

export type AbiDocument = {
  block_number: Long;
  contract: string;
  hex: string;
};

export type AbisServiceConfig = {
  url: string;
  limit?: number;
  filter?: string;
};

export type AbisConfig = {
  service: AbisServiceConfig;
  mongo: MongoConfig;
  featured: FeaturedConfig;
};
