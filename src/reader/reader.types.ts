import { BroadcastConfig, MongoConfig } from '@alien-worlds/api-core';
import { BlockRangeScanConfig } from '../common/block-range-scanner';
import { WorkersConfig } from '../common/workers';
import { BlockReaderConfig } from '../common/blockchain/block-reader';

export type ReaderConfig = {
  broadcast?: BroadcastConfig;
  blockReader?: BlockReaderConfig;
  mongo?: MongoConfig;
  scanner?: BlockRangeScanConfig;
  workers?: WorkersConfig;
  mode?: string;
  maxBlockNumber?: number;
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
