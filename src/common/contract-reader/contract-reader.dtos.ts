import { MongoDB } from "@alien-worlds/storage-mongodb";

export type FeaturedContractDocument = {
  _id?: MongoDB.ObjectId;
  account?: string;
  initial_block_number?: MongoDB.Long;
};

export type FeaturedContractModel = {
  account: string;
  initialBlockNumber: bigint;
};

export type FetchContractResponse = {
  account: string;
  block_num: string | number;
};
