import { Binary, Long, ObjectId } from '@alien-worlds/api-core';
import { ActionTraceModel } from '../blockchain/block-content/action-trace';
import { DeltaRowModel } from '../blockchain/block-content/delta';

export type ProcessorTaskDocument = {
  _id?: ObjectId;
  abi?: string;
  short_id?: string;
  label?: string;
  timestamp?: Date;
  type?: string;
  mode?: string;
  content?: Binary;
  hash?: string;
  block_number?: Long;
  block_timestamp?: Date;
};

export type ProcessorTaskModel = {
  id: string;
  abi: string;
  path: string;
  label: string;
  timestamp: Date;
  type: string;
  mode: string;
  content: Buffer;
  hash: string;
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
