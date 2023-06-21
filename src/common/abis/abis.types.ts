import { MongoConfig, MongoDB } from '@alien-worlds/storage-mongodb';

export type ContractEncodedAbiJson = {
  blockNumber: bigint;
  contract: string;
  hex: string;
};

export type ContractEncodedAbiMongoModel = {
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
};
