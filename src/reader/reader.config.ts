import { BlockReaderConfig } from '@alien-worlds/block-reader';
import { BroadcastConfig } from '@alien-worlds/broadcast';
import { WorkersConfig } from '@alien-worlds/workers';
import { BlockRangeScanConfig, UnprocessedBlockQueueConfig } from '../common';
import { UnknownObject } from '@alien-worlds/api-core';

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
