import { BroadcastConfig } from '@alien-worlds/aw-broadcast';
import { WorkersConfig } from '@alien-worlds/aw-workers';
import { BlockRangeScanConfig, UnprocessedBlockQueueConfig } from '../common';
import { BlockReaderConfig, UnknownObject } from '@alien-worlds/aw-core';

export type ReaderConfig<DatabaseConfig = UnknownObject> = {
  broadcast?: BroadcastConfig;
  blockReader?: BlockReaderConfig;
  database?: DatabaseConfig;
  scanner?: BlockRangeScanConfig;
  workers?: WorkersConfig;
  unprocessedBlockQueue: UnprocessedBlockQueueConfig;
  mode?: string;
  maxBlockNumber?: number;
  startBlock?: bigint;
  endBlock?: bigint;
};
