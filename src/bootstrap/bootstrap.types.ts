import { MongoConfig, BroadcastConfig } from '@alien-worlds/api-core';
import { AbisServiceConfig } from '../common/abis';
import { BlockRangeScanConfig } from '../common/block-range-scanner';
import { ContractReaderConfig } from '../common/blockchain';
import { FeaturedConfig } from '../common/featured';
import { Mode } from '../common';

export type BootstrapConfig = {
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
  startFromHead?: boolean;
  mode: string;
  featured: FeaturedConfig;
  abis: AbisServiceConfig;
  maxBlockNumber?: number;
};

export type BootstrapCommandOptions = {
  scanKey: string;
  startBlock: string;
  endBlock: string;
  mode: Mode;
};
