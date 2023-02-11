import { MongoDB } from "@alien-worlds/api-core";

export type ProcessorTaskQueueConfig = {
  session?: {
    interval?: number;
    readConcern?: MongoDB.ReadConcernLevel;
    writeConcern?: MongoDB.W;
    readPreference?: string;
  };
};
