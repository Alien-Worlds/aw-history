import { BroadcastConfig } from '@alien-worlds/broadcast';
import { BlockRangeScanConfig } from '../common/block-range-scanner';
import { MongoConfig } from '@alien-worlds/storage-mongodb';
import { BlockReaderConfig } from '@alien-worlds/block-reader';
import { WorkersConfig } from '@alien-worlds/workers';

export type ReaderConfig = {
  broadcast?: BroadcastConfig;
  blockReader?: BlockReaderConfig;
  mongo?: MongoConfig;
  scanner?: BlockRangeScanConfig;
  workers?: WorkersConfig;
  mode?: string;
  maxBlockNumber?: number;
  blockQueueMaxBytesSize?: number;
  blockQueueSizeCheckInterval?: number;
  blockQueueBatchSize?: number;
  startBlock?: bigint;
  endBlock?: bigint;
};

export type ReaderCommandOptions = {
  startBlock?: bigint;
  endBlock?: bigint;
  mode?: string;
  scanKey?: string;
  threads?: number;
};

export type ReadTaskData = {
  startBlock?: bigint;
  endBlock?: bigint;
  mode?: string;
  scanKey?: string;
};

export type ReadCompleteData = {
  startBlock?: bigint;
  endBlock?: bigint;
  scanKey?: string;
};

export type ReadProgressData = {
  min?: bigint;
  max?: bigint;
};
