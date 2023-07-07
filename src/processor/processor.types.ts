import { ProcessorConfig } from './processor.config';

export type ProcessorCommandOptions = {
  threads: number;
};

export type ProcessorSharedData = {
  config: ProcessorConfig;
  processorsPath: string;
};

export type DeltaProcessorModel<DataType = unknown> = {
  name: string;
  code: string;
  scope: string;
  table: string;
  payer: string;
  primary_key: string;
  block_number: string;
  block_timestamp: Date;
  data: DataType;
};

export type ActionTraceProcessorModel<DataType = unknown> = {
  account: string;
  name: string;
  block_timestamp: Date;
  block_number: string;
  global_sequence: string;
  recv_sequence: string;
  transaction_id: string;
  data: DataType;
};
