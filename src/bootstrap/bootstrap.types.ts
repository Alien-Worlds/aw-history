import { AbisServiceConfig } from '../common/abis';
import { BlockRangeScanConfig } from '../reader/block-range-scanner';
import { BlockchainConfig, ContractReaderConfig } from '../common/blockchain';
import { FeaturedConfig } from '../common/featured';
import { Mode } from '../common';
import { MongoConfig } from '@alien-worlds/storage-mongodb';
import { BroadcastConfig } from '@alien-worlds/broadcast';

export type BootstrapConfig = {
  broadcast: BroadcastConfig;
  blockchain: BlockchainConfig;
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

export type BlockRangeData = {
  startBlock?: bigint;
  endBlock?: bigint;
  mode: string;
  scanKey?: string;
};
