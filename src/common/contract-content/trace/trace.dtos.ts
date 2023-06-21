import { ActionTraceByNameDto } from '../action-trace';

export type PartialJson = {
  expiration: string;
  ref_block_num: number;
  ref_block_prefix: number;
  max_net_usage_words: number;
  max_cpu_usage_ms: number;
  delay_sec: number;
  transaction_extensions: unknown[];
  signatures: unknown[];
  context_free_data: unknown[];
};

export type PartialByTypeJson = [string, PartialJson];

export type TraceJson = {
  id?: string;
  status?: number;
  cpu_usage_us?: number;
  net_usage_words?: number;
  elapsed?: string;
  net_usage?: string;
  scheduled?: boolean;
  action_traces?: ActionTraceByNameDto[];
  account_ram_delta?: unknown;
  except?: unknown;
  error_code?: number | string;
  failed_dtrx_trace?: unknown;
  partial?: PartialByTypeJson;
};

export type TraceByNameJson = [string, TraceJson];
