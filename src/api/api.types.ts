import { UnknownObject } from '@alien-worlds/aw-core';

export type ApiCommandOptions = {
  host: string;
  port: number;
};

export type ApiConfig<DatabaseConfig = UnknownObject> = {
  host: string;
  port: number;
  database: DatabaseConfig;
};
