import { MongoConfig } from '@alien-worlds/api-core';

export type BlockReaderConfig = {
  mongo: MongoConfig;
  endpoints: string[];
  reconnectInterval?: number;
  shouldFetchDeltas?: boolean;
  shouldFetchTraces?: boolean;
  shouldFetchBlock?: boolean;
};
