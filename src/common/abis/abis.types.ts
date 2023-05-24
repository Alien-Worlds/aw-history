import { MongoDB, MongoConfig } from '@alien-worlds/api-core';
import { FeaturedConfig } from '../featured';

export type ContractEncodedAbiJson = {
  blockNumber: bigint;
  contract: string;
  hex: string;
};

export type ContractEncodedAbiDocument = {
  block_number: MongoDB.Long;
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
