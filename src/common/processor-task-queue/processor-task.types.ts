import { ActionTrace } from '../types';

export type ProcessorTaskError = {
  message: string;
  stack: string;
};

export type ProcessorTaskModel = {
  id: string;
  isFork: string;
  abi: string;
  path: string;
  label: string;
  timestamp: Date;
  type: string;
  mode: string;
  content: Buffer;
  hash: string;
  error?: ProcessorTaskError;
};

export type DeltaProcessorContentModel = {
  ship_delta_message_name: string;
  name: string;
  block_num: bigint;
  block_timestamp: Date;
  present: boolean;
  data: Uint8Array;
};

export type ActionProcessorContentModel = {
  ship_trace_message_name: string;
  transaction_id: string;
  block_num: bigint;
  block_timestamp: Date;
  action_trace: ActionTrace;
};
