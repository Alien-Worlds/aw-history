import { UnknownObject } from '@alien-worlds/api-core';
import { AbisServiceConfig } from '../common';
import { BlockRangeScanConfig } from '../common/block-range-scanner';
import { FeaturedConfig } from '../common/featured';
import { BroadcastConfig } from '@alien-worlds/broadcast';

export type BlockchainConfig = {
  endpoint: string;
  chainId: string;
};

export type BootstrapConfig<DatabaseConfig = UnknownObject> = {
  database: DatabaseConfig;
  broadcast: BroadcastConfig;
  scanner: BlockRangeScanConfig;
  startBlock?: bigint;
  endBlock?: bigint;
  startFromHead?: boolean;
  mode: string;
  featured: FeaturedConfig;
  abis: AbisServiceConfig;
  blockchain: BlockchainConfig;
  maxBlockNumber?: number;
};
