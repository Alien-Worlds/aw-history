import { MongoConfig } from '@alien-worlds/api-core';
import { BlockRangeScanConfig } from '../common/block-range-scanner';
import { BlockReaderConfig } from '../common/blockchain/block-reader';
import { BroadcastConfig } from '../common/broadcast';
import { FeaturedConfig } from '../common/featured';

export type BlockRangeConfig = {
  broadcast?: BroadcastConfig;
  reader?: BlockReaderConfig;
  mongo?: MongoConfig;
  scanner?: BlockRangeScanConfig;
  featured?: FeaturedConfig;
  threads?: number;
  mode?: string;
  scanKey?: string;
};
