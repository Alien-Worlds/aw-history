import { MongoConfig } from '@alien-worlds/api-core';

export type ApiConfig = {
  port: number;
  mongo: MongoConfig;
};
