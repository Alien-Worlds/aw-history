import { MongoConfig } from '@alien-worlds/api-core';
import { AbisServiceConfig } from '../common/abis';
import { BlockRangeScanConfig } from '../common/block-range-scanner';
import { ContractReaderConfig } from '../common/blockchain';
import { BroadcastConfig } from '../common/broadcast';
import { FeaturedConfig } from '../common/featured';

export type FillerConfig = {
  broadcast: BroadcastConfig;
  blockchain: {
    endpoint: string;
    chainId: string;
  };
  contractReader: ContractReaderConfig;
  scanner: BlockRangeScanConfig;
  mongo: MongoConfig;
  startBlock?: bigint;
  endBlock?: bigint;
  mode: string;
  featured: FeaturedConfig;
  abis: AbisServiceConfig;
};
