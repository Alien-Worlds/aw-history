import { UnknownObject } from "@alien-worlds/api-core";

export type ApiConfig<DatabaseConfig = UnknownObject> = {
  port: number;
  database: DatabaseConfig;
};
