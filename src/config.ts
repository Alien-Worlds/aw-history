import { MongoConfig, BroadcastConfig } from '@alien-worlds/api-core';
import { ApiConfig } from './api';
import { AbisConfig } from './common/abis';
import { BlockRangeScanConfig } from './common/block-range-scanner';
import { BlockReaderConfig } from './common/blockchain/block-reader';
import { ContractReaderConfig } from './common/blockchain/contract-reader';
import { FeaturedConfig } from './common/featured';
import { ProcessorTaskQueueConfig } from './common/processor-task-queue/processor-task-queue.config';
import { WorkersConfig } from './common/workers';

export type HistoryToolsConfig = {
  api: ApiConfig;
  broadcast: BroadcastConfig;
  blockchain: {
    endpoint: string;
    chainId: string;
    [key: string]: unknown;
  };
  scanner: BlockRangeScanConfig;
  blockReader: BlockReaderConfig;
  contractReader: ContractReaderConfig;
  mongo: MongoConfig;
  featured: FeaturedConfig;
  abis: AbisConfig;
  processor: {
    workers: WorkersConfig;
    taskQueue: ProcessorTaskQueueConfig;
    [key: string]: unknown;
  };
  blockRange: { workers: WorkersConfig };
  startBlock: bigint;
  endBlock: bigint;
  mode: string;
  [key: string]: unknown;
};
