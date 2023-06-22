import { FeaturedConfig, ProcessorMatcher } from '../common/featured';
import { ProcessorTaskQueueConfig } from '../common/processor-task-queue/processor-task-queue.config';
import { MongoConfig } from '@alien-worlds/storage-mongodb';
import { BroadcastConfig } from '@alien-worlds/broadcast';
import { WorkersConfig } from '@alien-worlds/workers';

export type ProcessorCommandOptions = {
  threads: number;
};

export type ProcessorConfig = {
  broadcast: BroadcastConfig;
  workers: WorkersConfig;
  featured: FeaturedConfig;
  mongo: MongoConfig;
  queue: ProcessorTaskQueueConfig;
  processorLoaderPath?: string;
  [key: string]: unknown;
};

export type ProcessorAddons = {
  matchers?: {
    traces?: ProcessorMatcher;
    deltas?: ProcessorMatcher;
    [key: string]: ProcessorMatcher;
  };
  [key: string]: unknown;
};

export type ProcessorSharedData = {
  config: ProcessorConfig;
};

export type DeltaProcessorInput<DataType = unknown> = {
  name: string;
  code: string;
  scope: string;
  table: string;
  payer: string;
  primaryKey: bigint;
  blockNumber: bigint;
  blockTimestamp: Date;
  data: DataType;
};

export type ActionTraceProcessorInput<DataType = unknown> = {
  blockNumber: bigint;
  blockTimestamp: Date;
  transactionId: string;
  account: string;
  name: string;
  recvSequence: bigint;
  globalSequence: bigint;
  data: DataType;
};
