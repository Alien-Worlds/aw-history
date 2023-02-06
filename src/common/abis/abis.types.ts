import { MongoDB, MongoConfig } from '@alien-worlds/api-core';
import { FeaturedConfig } from '../featured';

export type AbiJson = {
  blockNumber: bigint;
  contract: string;
  hex: string;
};

export type AbiDocument = {
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

export type AbiTable = {
  name: string;
  type: string;
  index_type: string;
  key_names: string[];
  key_types: string[];
};
