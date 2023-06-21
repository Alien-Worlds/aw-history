import { ProcessorTaskQueueConfig } from '../common/processor-task-queue/processor-task-queue.config';
import { AbisConfig } from '../common/abis';
import { WorkersConfig } from '@alien-worlds/workers';
import { BroadcastConfig } from '@alien-worlds/broadcast';
import { FeaturedConfig } from '../common';
import { MongoConfig } from '@alien-worlds/storage-mongodb';
import { UnknownObject } from '@alien-worlds/api-core';
import { TransactionJson } from '../common/contract-content/transaction';

export type FilterSharedData = {
  config: FilterConfig;
  featuredJson: UnknownObject;
};

export type FilterCommandOptions = {
  threads: number;
  mode: string;
};

export type FilterConfig = {
  mode: string;
  broadcast: BroadcastConfig;
  workers: WorkersConfig;
  featured: FeaturedConfig;
  abis: AbisConfig;
  mongo: MongoConfig;
  queue: ProcessorTaskQueueConfig;
  [key: string]: unknown;
};

export type FilterAddons = {
  matchers?: unknown;
  [key: string]: unknown;
};

export type BlockNumberWithId = {
  block_num: string;
  block_id: string;
};

export type SignedBlockJson = {
  timestamp: string;
  producer: string;
  confirmed: number;
  previous: string;
  transaction_mroot: string;
  action_mroot: string;
  schedule_version: number;
  new_producers: unknown;
  header_extensions: unknown[];
  producer_signature: string;
  transactions: TransactionJson[];
};

export type DeserializedBlock = {
  head?: BlockNumberWithId;
  this_block?: BlockNumberWithId;
  last_irreversible?: BlockNumberWithId;
  prev_block?: BlockNumberWithId;
  block?: SignedBlockJson;
  traces?: [[string, TraceJson]];
  deltas?: [[string, DeltaJson]];
  abi_version?: string;
};

//

export type AuthSequenceJson = {
  account: string;
  sequence: string;
};

export type ReceiptJson = {
  receiver: string;
  act_digest: string;
  global_sequence: string;
  recv_sequence: string;
  auth_sequence: AuthSequenceJson[];
  code_sequence: number;
  abi_sequence: number;
};

export type ReceiptByNameDto = [string, ReceiptJson];

export type ActAuthJson = {
  actor: string;
  permission: string;
};

export type ActJson = {
  account: string;
  name: string;
  authorization: ActAuthJson;
  data: Uint8Array;
};

export type ActionTraceDto = {
  ship_message_name?: string;
  action_ordinal?: number;
  creator_action_ordinal?: number;
  receipt?: ReceiptByNameDto;
  receiver?: string;
  act?: ActJson;
  context_free?: boolean;
  elapsed?: string;
  console?: string;
  account_ram_deltas?: unknown[];
  except?: unknown;
  error_code?: string | number;
};

export type ActionTraceByNameDto = [string, ActionTraceDto];

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

export type DeltaRowDto = {
  present?: number;
  data?: Uint8Array;
};

export type DeltaJson = {
  name?: string;
  rows?: DeltaRowDto[];
};

export type DeltaByNameDto = [string, DeltaJson];

export type DeltaRowModel = {
  present?: number;
  data?: Uint8Array;
};
