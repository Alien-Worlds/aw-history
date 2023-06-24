import {
  BootstrapConfig,
  FilterConfig,
  ProcessorConfig,
  ReaderConfig,
} from '@alien-worlds/history-tools-common';
import { ApiConfig } from '../api';

export type BlockchainConfig = {
  endpoint: string;
  chainId: string;
};

export type HistoryToolsConfig = {
  api: ApiConfig;
  bootstrap: BootstrapConfig;
  reader: ReaderConfig;
  filter: FilterConfig;
  processor: ProcessorConfig;
  [key: string]: unknown;
};
