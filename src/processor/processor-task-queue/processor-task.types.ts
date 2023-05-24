import { MongoDB } from '@alien-worlds/api-core';
import { ActionTraceModel } from '../../common/blockchain/contract/action-trace';
import { DeltaRowModel } from '../../common/blockchain/contract/delta';

export type ProcessorTaskError = {
  message: string;
  stack: string;
};

export type ProcessorTaskDocument = {
  _id?: MongoDB.ObjectId;
  abi?: string;
  is_fork?: boolean;
  short_id?: string;
  label?: string;
  timestamp?: Date;
  type?: string;
  mode?: string;
  content?: MongoDB.Binary;
  hash?: string;
  block_number?: MongoDB.Long;
  block_timestamp?: Date;
  error?: ProcessorTaskError;
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
  shipDeltaMessageName: string;
  name: string;
  blockNumber: bigint;
  blockTimestamp: Date;
  row: DeltaRowModel;
};

export type ActionProcessorContentModel = {
  shipTraceMessageName: string;
  transactionId: string;
  blockNumber: bigint;
  blockTimestamp: Date;
  actionTrace: ActionTraceModel;
};
