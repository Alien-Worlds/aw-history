import { UnknownObject } from '@alien-worlds/history-tools-common';

export type ApiConfig<DatabaseConfig = UnknownObject> = {
  port: number;
  database: DatabaseConfig;
};
