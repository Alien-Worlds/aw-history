import { UnknownObject } from '@alien-worlds/api-core';

export type ApiCommandOptions = {
  port: number;
};

export type ApiConfig<DatabaseConfig = UnknownObject> = {
  port: number;
  database: DatabaseConfig;
};
