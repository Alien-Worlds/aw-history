import { MongoConfig } from '@alien-worlds/api-core';
import { AbisServiceConfig } from '../common/abis';
import { BlockRangeScanConfig } from '../common/block-range-scanner';
import { BlockReaderConfig } from '../common/blockchain/block-reader';
import { BroadcastConfig } from '../common/broadcast';
import { FeaturedConfig, FeaturedMatchers } from '../common/featured';
import { WorkersConfig } from '../common/workers';

export type BlockRangeConfig = {
  broadcast?: BroadcastConfig;
  reader?: BlockReaderConfig;
  mongo?: MongoConfig;
  scanner?: BlockRangeScanConfig;
  featured?: FeaturedConfig;
  abis?: AbisServiceConfig;
  workers?: WorkersConfig;
  mode?: string;
  scanKey?: string;
  interval?: number;
};

export type BlockRangeAddons = {
  matchers?: FeaturedMatchers;
};
