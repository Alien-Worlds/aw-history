import { MongoConfig } from '@alien-worlds/api-core';
import { BlockRangeScanConfig } from '../common/block-range-scanner';
import { BroadcastConfig } from '../common/broadcast';

export type FillerConfig = {
  broadcast: BroadcastConfig;
  blockchain: {
    endpoint: string;
    chainId: string;
  };
  scanner: BlockRangeScanConfig;
  mongo: MongoConfig;
  startBlock?: bigint;
  endBlock?: bigint;
  mode: string;
};
