import { ApiConfig } from '../api';
import { BootstrapConfig } from '../bootstrap';
import { ReaderConfig } from '../reader';
import { FilterConfig } from '../filter';
import { ProcessorConfig } from '../processor';

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