import { AbisServiceConfig } from '../common/abis';
import { BlockRangeScanConfig } from '../common/block-range-scanner';
import { FeaturedConfig } from '../common/featured';
import { Mode } from '../common';
import { BroadcastConfig } from '@alien-worlds/broadcast';
import { BlockchainConfig } from '../config';

export type BootstrapConfig = {
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

export type BootstrapCommandOptions = {
  scanKey: string;
  startBlock: string;
  endBlock: string;
  mode: Mode;
};

export type BlockRangeData = {
  startBlock?: bigint;
  endBlock?: bigint;
  mode: string;
  scanKey?: string;
};
