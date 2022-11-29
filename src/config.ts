import { MongoConfig } from '@alien-worlds/api-core';
import { AbisConfig } from './common/abis';
import { BlockRangeScanConfig } from './common/block-range-scanner';
import { BlockReaderConfig } from './common/blockchain/block-reader';
import { BroadcastConfig } from './common/broadcast';
import { FeaturedConfig } from './common/featured';
import { WorkersConfig } from './common/workers';

export type HistoryToolsConfig = {
  broadcast: BroadcastConfig;
  blockchain: {
    endpoint: string;
    chainId: string;
  };
  scanner: BlockRangeScanConfig;
  reader: BlockReaderConfig;
  mongo: MongoConfig;
  startBlock: bigint;
  endBlock: bigint;
  mode: string;
  featured: FeaturedConfig;
  abis: AbisConfig;
  workers: WorkersConfig;
};
