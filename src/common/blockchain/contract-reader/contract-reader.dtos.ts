import { Long, ObjectId } from '@alien-worlds/api-core';

export type FeaturedContractDocument = {
  _id?: ObjectId;
  account?: string;
  initial_block_number?: Long;
};

export type FeaturedContractModel = {
  account: string;
  initialBlockNumber: bigint;
};

export type FetchContractResponse = {
  account: string;
  block_num: string | number;
};
