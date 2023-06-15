import { MongoConfig } from "@alien-worlds/storage-mongodb";

export type ApiConfig = {
  port: number;
  mongo: MongoConfig;
};
