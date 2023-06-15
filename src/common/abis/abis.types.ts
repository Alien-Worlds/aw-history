import { MongoConfig, MongoDB } from '@alien-worlds/storage-mongodb';
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
