import { ProcessorTaskQueueConfig } from '../processor/processor-task-queue/processor-task-queue.config';
import {
  ConfigVars,
  buildBroadcastConfig,
  buildMongoConfig,
  parseToBigInt,
} from '@alien-worlds/api-core';
import { ApiConfig } from '../api';
import { BootstrapConfig, BootstrapCommandOptions } from '../bootstrap';
import { ReaderConfig, ReaderCommandOptions } from '../reader';
import { FilterConfig, FilterCommandOptions } from '../filter';
import { ProcessorConfig, ProcessorCommandOptions } from '../processor';
import { HistoryToolsConfig } from './config.types';
import {
  AbisConfig,
  AbisServiceConfig,
  BlockRangeScanConfig,
  BlockReaderConfig,
  ContractReaderConfig,
  FeaturedConfig,
  WorkersConfig,
} from '../common';

export * from './config.types';

export const buildBlockchainConfig = (
  vars: ConfigVars
): { endpoint: string; chainId: string } => ({
  endpoint: vars.getStringEnv('BLOCKCHAIN_ENDPOINT'),
  chainId: vars.getStringEnv('BLOCKCHAIN_CHAIN_ID'),
});

export const buildContractReaderConfig = (vars: ConfigVars): ContractReaderConfig => ({
  url: vars.getStringEnv('HYPERION_URL'),
});

export const buildBlockRangeScanConfig = (
  vars: ConfigVars,
  scanKey?: string
): BlockRangeScanConfig => ({
  maxChunkSize: vars.getNumberEnv('SCANNER_NODES_MAX_CHUNK_SIZE'),
  scanKey: scanKey || vars.getStringEnv('SCANNER_SCAN_KEY'),
});

export const buildAbisServiceConfig = (vars: ConfigVars): AbisServiceConfig => ({
  url: vars.getStringEnv('HYPERION_URL'),
  limit: vars.getNumberEnv('ABIS_SERVICE_LIMIT'),
  filter: vars.getStringEnv('ABIS_SERVICE_FILTER'),
});

export const buildAbisConfig = (
  vars: ConfigVars,
  featured: FeaturedConfig
): AbisConfig => ({
  service: buildAbisServiceConfig(vars),
  mongo: buildMongoConfig(vars),
  featured,
});

export const buildBlockReaderConfig = (vars: ConfigVars): BlockReaderConfig => ({
  mongo: buildMongoConfig(vars),
  endpoints: vars.getArrayEnv('BLOCK_READER_ENDPOINTS'),
  shouldFetchDeltas: vars.getBooleanEnv('BLOCK_READER_FETCH_DELTAS'),
  shouldFetchTraces: vars.getBooleanEnv('BLOCK_READER_FETCH_TRACES'),
});

export const buildReaderWorkersConfig = (
  vars: ConfigVars,
  threadsCount?: number
): WorkersConfig => ({
  threadsCount: threadsCount || vars.getNumberEnv('READER_MAX_THREADS'),
  inviolableThreadsCount: vars.getNumberEnv('READER_INVIOLABLE_THREADS_COUNT'),
});

export const buildProcessorWorkersConfig = (
  vars: ConfigVars,
  threadsCount?: number
): WorkersConfig => ({
  threadsCount: threadsCount || vars.getNumberEnv('PROCESSOR_MAX_THREADS'),
  inviolableThreadsCount: vars.getNumberEnv('PROCESSOR_INVIOLABLE_THREADS_COUNT'),
});

export const buildFilterWorkersConfig = (
  vars: ConfigVars,
  options?: FilterCommandOptions
): WorkersConfig => ({
  threadsCount: options?.threads || vars.getNumberEnv('FILTER_MAX_THREADS'),
  inviolableThreadsCount: vars.getNumberEnv('FILTER_INVIOLABLE_THREADS_COUNT'),
});

export const buildProcessorTaskQueueConfig = (
  vars: ConfigVars
): ProcessorTaskQueueConfig => ({
  interval: vars.getNumberEnv('PROCESSOR_TASK_QUEUE_CHECK_INTERVAL'),
});

export const buildApiConfig = (vars: ConfigVars): ApiConfig => ({
  port: vars.getNumberEnv('PORT'),
  mongo: buildMongoConfig(vars),
});

export const buildBootstrapConfig = (
  vars: ConfigVars,
  featured: FeaturedConfig,
  options?: BootstrapCommandOptions
): BootstrapConfig => ({
  mongo: buildMongoConfig(vars),
  broadcast: buildBroadcastConfig(vars),
  blockchain: buildBlockchainConfig(vars),
  contractReader: buildContractReaderConfig(vars),
  scanner: buildBlockRangeScanConfig(vars, options?.scanKey),
  startBlock: options?.startBlock
    ? parseToBigInt(options?.startBlock)
    : vars.getStringEnv('START_BLOCK')
    ? parseToBigInt(vars.getStringEnv('START_BLOCK'))
    : null,
  endBlock: options?.endBlock
    ? parseToBigInt(options?.endBlock)
    : vars.getStringEnv('END_BLOCK')
    ? parseToBigInt(vars.getStringEnv('END_BLOCK'))
    : null,
  startFromHead: vars.getBooleanEnv('START_FROM_HEAD'),
  mode: options?.mode || vars.getStringEnv('MODE'),
  featured,
  abis: buildAbisServiceConfig(vars),
  maxBlockNumber: vars.getNumberEnv('MAX_BLOCK_NUMBER'),
});

export const buildReaderConfig = (
  vars: ConfigVars,
  options?: ReaderCommandOptions
): ReaderConfig => ({
  mongo: buildMongoConfig(vars),
  broadcast: buildBroadcastConfig(vars),
  scanner: buildBlockRangeScanConfig(vars, options?.scanKey),
  mode: options?.mode || vars.getStringEnv('MODE'),
  maxBlockNumber: vars.getNumberEnv('MAX_BLOCK_NUMBER'),
  blockQueueMaxBytesSize: vars.getNumberEnv('UNPROCESSED_BLOCK_QUEUE_MAX_BYTES_SIZE'),
  blockQueueSizeCheckInterval: vars.getNumberEnv('UNPROCESSED_BLOCK_QUEUE_SIZE_CHECK_INTERVAL'),
  blockQueueBatchSize: vars.getNumberEnv('UNPROCESSED_BLOCK_QUEUE_BATCH_SIZE'),
  workers: buildReaderWorkersConfig(vars, options?.threads),
  blockReader: buildBlockReaderConfig(vars),
  startBlock: options?.startBlock ? parseToBigInt(options?.startBlock) : null,
  endBlock: options?.endBlock ? parseToBigInt(options?.endBlock) : null,
});

export const buildFilterConfig = (
  vars: ConfigVars,
  featured: FeaturedConfig,
  options?: FilterCommandOptions
): FilterConfig => ({
  mode: options?.mode || vars.getStringEnv('MODE'),
  broadcast: buildBroadcastConfig(vars),
  workers: buildFilterWorkersConfig(vars, options),
  featured,
  abis: buildAbisConfig(vars, featured),
  contractReader: buildContractReaderConfig(vars),
  mongo: buildMongoConfig(vars),
  queue: buildProcessorTaskQueueConfig(vars),
});

export const buildProcessorConfig = (
  vars: ConfigVars,
  featured: FeaturedConfig,
  options?: ProcessorCommandOptions
): ProcessorConfig => ({
  broadcast: buildBroadcastConfig(vars),
  workers: buildProcessorWorkersConfig(vars, options?.threads),
  featured,
  mongo: buildMongoConfig(vars),
  queue: buildProcessorTaskQueueConfig(vars),
});

export const buildHistoryToolsConfig = (
  vars: ConfigVars,
  featured: FeaturedConfig
): HistoryToolsConfig => ({
  api: buildApiConfig(vars),
  bootstrap: buildBootstrapConfig(vars, featured),
  reader: buildReaderConfig(vars),
  filter: buildFilterConfig(vars, featured),
  processor: buildProcessorConfig(vars, featured),
});
