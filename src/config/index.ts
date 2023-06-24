import {
  AbisConfig,
  AbisServiceConfig,
  BlockRangeScanConfig,
  BlockReaderConfig,
  BlockchainConfig,
  BootstrapConfig,
  ConfigVars,
  FeaturedConfig,
  FeaturedContractDataCriteria,
  FilterConfig,
  ProcessorConfig,
  ProcessorTaskQueueConfig,
  ReaderConfig,
  UnknownObject,
  UnprocessedBlockQueueConfig,
  WorkersConfig,
  buildBroadcastConfig,
  parseToBigInt,
} from '@alien-worlds/history-tools-common';
import { FilterCommandOptions } from '../filter';
import { ApiConfig } from '../api';
import { BootstrapCommandOptions } from '../bootstrap';
import { ReaderCommandOptions } from '../reader';
import { ProcessorCommandOptions } from '../processor';
import { HistoryToolsConfig } from './config.types';

export * from './config.types';

export const buildBlockchainConfig = (vars: ConfigVars): BlockchainConfig => ({
  endpoint: vars.getStringEnv('BLOCKCHAIN_ENDPOINT'),
  chainId: vars.getStringEnv('BLOCKCHAIN_CHAIN_ID'),
});

export const buildFeaturedConfig = (vars: ConfigVars): FeaturedConfig => ({
  rpcUrl: vars.getStringEnv('BLOCKCHAIN_ENDPOINT'),
  serviceUrl: vars.getStringEnv('HYPERION_URL'),
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
  databaseConfigBuilder: (vars: ConfigVars, ...args: unknown[]) => UnknownObject
): AbisConfig => ({
  service: buildAbisServiceConfig(vars),
  database: databaseConfigBuilder(vars),
});

export const buildBlockReaderConfig = (vars: ConfigVars): BlockReaderConfig => ({
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

export const buildUnprocessedBlockQueueConfig = (
  vars: ConfigVars
): UnprocessedBlockQueueConfig => ({
  maxBytesSize: vars.getNumberEnv('UNPROCESSED_BLOCK_QUEUE_MAX_BYTES_SIZE'),
  sizeCheckInterval: vars.getNumberEnv('UNPROCESSED_BLOCK_QUEUE_SIZE_CHECK_INTERVAL'),
  batchSize: vars.getNumberEnv('UNPROCESSED_BLOCK_QUEUE_BATCH_SIZE'),
});

export const buildApiConfig = (
  vars: ConfigVars,
  databaseConfigBuilder: (vars: ConfigVars, ...args: unknown[]) => UnknownObject
): ApiConfig => ({
  port: vars.getNumberEnv('API_PORT'),
  database: databaseConfigBuilder(vars),
});

export const buildBootstrapConfig = (
  vars: ConfigVars,
  databaseConfigBuilder: (vars: ConfigVars, ...args: unknown[]) => UnknownObject,
  options?: BootstrapCommandOptions
): BootstrapConfig => ({
  database: databaseConfigBuilder(vars),
  broadcast: buildBroadcastConfig(vars),
  blockchain: buildBlockchainConfig(vars),
  featured: buildFeaturedConfig(vars),
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
  abis: buildAbisServiceConfig(vars),
  maxBlockNumber: vars.getNumberEnv('MAX_BLOCK_NUMBER'),
});

export const buildReaderConfig = (
  vars: ConfigVars,
  databaseConfigBuilder: (vars: ConfigVars, ...args: unknown[]) => UnknownObject,
  options?: ReaderCommandOptions
): ReaderConfig => ({
  database: databaseConfigBuilder(vars),
  broadcast: buildBroadcastConfig(vars),
  scanner: buildBlockRangeScanConfig(vars, options?.scanKey),
  mode: options?.mode || vars.getStringEnv('MODE'),
  maxBlockNumber: vars.getNumberEnv('MAX_BLOCK_NUMBER'),
  unprocessedBlockQueue: buildUnprocessedBlockQueueConfig(vars),
  workers: buildReaderWorkersConfig(vars, options?.threads),
  blockReader: buildBlockReaderConfig(vars),
  startBlock: options?.startBlock ? parseToBigInt(options?.startBlock) : null,
  endBlock: options?.endBlock ? parseToBigInt(options?.endBlock) : null,
});

export const buildFilterConfig = (
  vars: ConfigVars,
  databaseConfigBuilder: (vars: ConfigVars, ...args: unknown[]) => UnknownObject,
  options?: FilterCommandOptions
): FilterConfig => ({
  mode: options?.mode || vars.getStringEnv('MODE'),
  broadcast: buildBroadcastConfig(vars),
  workers: buildFilterWorkersConfig(vars, options),
  abis: buildAbisConfig(vars, databaseConfigBuilder),
  featured: buildFeaturedConfig(vars),
  database: databaseConfigBuilder(vars),
  processorTaskQueue: buildProcessorTaskQueueConfig(vars),
  unprocessedBlockQueue: buildUnprocessedBlockQueueConfig(vars),
});

export const buildProcessorConfig = (
  vars: ConfigVars,
  databaseConfigBuilder: (vars: ConfigVars, ...args: unknown[]) => UnknownObject,
  options?: ProcessorCommandOptions
): ProcessorConfig => ({
  broadcast: buildBroadcastConfig(vars),
  workers: buildProcessorWorkersConfig(vars, options?.threads),
  featured: buildFeaturedConfig(vars),
  database: databaseConfigBuilder(vars),
  queue: buildProcessorTaskQueueConfig(vars),
});

export const buildHistoryToolsConfig = (
  vars: ConfigVars,
  databaseConfigBuilder: (vars: ConfigVars, ...args: unknown[]) => UnknownObject,
  featuredCriteria?: FeaturedContractDataCriteria,
  bootstrapOptions?: BootstrapCommandOptions,
  readerOptions?: ReaderCommandOptions,
  filterOptions?: FilterCommandOptions,
  processorOptions?: ProcessorCommandOptions
): HistoryToolsConfig => ({
  api: buildApiConfig(vars, databaseConfigBuilder),
  bootstrap: buildBootstrapConfig(vars, databaseConfigBuilder, bootstrapOptions),
  reader: buildReaderConfig(vars, databaseConfigBuilder, readerOptions),
  filter: buildFilterConfig(vars, databaseConfigBuilder, filterOptions),
  processor: buildProcessorConfig(vars, databaseConfigBuilder, processorOptions),
});
