import { UnknownObject } from '@alien-worlds/api-core';

export type AbisServiceConfig = {
  url: string;
  limit?: number;
  filter?: string;
  [key: string]: unknown;
};

export type AbisConfig<DatabaseConfig = UnknownObject> = {
  service: AbisServiceConfig;
  database: DatabaseConfig;
};
