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
  scanKey?: string;
  maxBlockNumber?: number;
};
