import { UnknownObject } from '@alien-worlds/aw-core';

export type ApiCommandOptions = {
  port: number;
};

export type ApiConfig<DatabaseConfig = UnknownObject> = {
  port: number;
  database: DatabaseConfig;
};
