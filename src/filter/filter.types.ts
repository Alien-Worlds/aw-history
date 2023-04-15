import { MongoConfig, BroadcastConfig } from '@alien-worlds/api-core';
import { FeaturedConfig, FeaturedMatchers } from '../common/featured';
import { ProcessorTaskQueueConfig } from '../common/processor-task-queue/processor-task-queue.config';
import { WorkersConfig } from '../common/workers';
import { AbisConfig } from '../common/abis';
import { ContractReaderConfig } from '../common/blockchain';

export type FilterSharedData = {
  config: FilterConfig;
};

export type FilterCommandOptions = {
  threads: number;
  mode: string;
};

export type FilterConfig = {
  mode: string;
  broadcast: BroadcastConfig;
  workers: WorkersConfig;
  featured: FeaturedConfig;
  abis: AbisConfig;
  contractReader: ContractReaderConfig;
  mongo: MongoConfig;
  queue: ProcessorTaskQueueConfig;
  [key: string]: unknown;
};

export type FilterAddons = {
  matchers?: FeaturedMatchers;
  [key: string]: unknown;
};
