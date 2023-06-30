import { ProcessorConfig } from './processor.config';

export type ProcessorCommandOptions = {
  threads: number;
};

export type ProcessorSharedData = {
  config: ProcessorConfig;
  processorsPath: string;
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
