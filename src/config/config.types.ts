import { ApiConfig } from '../api';
import { BootstrapConfig } from '../bootstrap';
import { FilterConfig } from '../filter';
import { ProcessorConfig } from '../processor';
import { ReaderConfig } from '../reader';

export type HistoryToolsConfig = {
  api: ApiConfig;
  bootstrap: BootstrapConfig;
  reader: ReaderConfig;
  filter: FilterConfig;
  processor: ProcessorConfig;
  [key: string]: unknown;
};
