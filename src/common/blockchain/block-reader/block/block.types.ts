import { MongoDB } from '@alien-worlds/api-core';

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
  abi_version?: string;
};

export type BlockDocument = {
  head?: BlockNumberWithIdDocument;
  this_block?: BlockNumberWithIdDocument;
  last_irreversible?: BlockNumberWithIdDocument;
  prev_block?: BlockNumberWithIdDocument;
  block?: MongoDB.Binary;
  traces?: MongoDB.Binary;
  deltas?: MongoDB.Binary;
  _id?: MongoDB.ObjectId;
  abi_version?: string;
  [key: string]: unknown;
};

export type BlockNumberWithIdDocument = {
  block_num?: MongoDB.Long;
  block_id?: string;
};
