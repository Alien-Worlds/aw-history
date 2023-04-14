import { MongoDB } from '@alien-worlds/api-core';
import { BlockReaderConnectionState } from './block-reader.enums';

export type ConnectionChangeHandlerOptions = {
  previousState: BlockReaderConnectionState;
  state: BlockReaderConnectionState;
  data: string;
};

export type ConnectionChangeHandler = (
  options: ConnectionChangeHandlerOptions
) => void | Promise<void>;

export type BlockReaderOptions = {
  shouldFetchDeltas?: boolean;
  shouldFetchTraces?: boolean;
};

export type BlockNumberWithIdJson = {
  block_num: string;
  block_id: string;
};

export type BlockJson = {
  head?: BlockNumberWithIdJson;
  this_block?: BlockNumberWithIdJson;
  last_irreversible?: BlockNumberWithIdJson;
  prev_block?: BlockNumberWithIdJson;
  block?: Uint8Array;
  traces?: Uint8Array;
  deltas?: Uint8Array;
  abi?: string;
  is_micro_fork?: boolean;
};

export type BlockNumberWithIdDocument = {
  block_num?: MongoDB.Long;
  block_id?: string;
};

export type BlockDocument = {
  _id?: MongoDB.ObjectId;
  abi?: string;
  is_micro_fork?: boolean;
  block_id?: string;
  block_num?: MongoDB.Long;
  head?: BlockNumberWithIdDocument;
  this_block?: BlockNumberWithIdDocument;
  last_irreversible?: BlockNumberWithIdDocument;
  prev_block?: BlockNumberWithIdDocument;
  block?: MongoDB.Binary;
  traces?: MongoDB.Binary;
  deltas?: MongoDB.Binary;
  [key: string]: unknown;
};
