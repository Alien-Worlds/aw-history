import { MongoDB } from "@alien-worlds/storage-mongodb";

export type FeaturedContractMongoModel = {
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

export type CriteriaValue = string | string[];

export type MatchCriteria = {
  contract: CriteriaValue;
  [key: string]: CriteriaValue;
};

export type ProcessorMatchCriteria<MatchCriteriaType = MatchCriteria> = {
  matcher?: string;
  processor: string;
} & MatchCriteriaType;

export type ProcessorMatcher<MatchCriteriaType = MatchCriteria> = Map<
  string,
  MatchFunction<MatchCriteriaType>
>;

export type MatchFunction<MatchCriteriaType = MatchCriteria> = (
  criteria: MatchCriteriaType
) => Promise<boolean>;

export type ContractActionMatchCriteria = MatchCriteria & {
  shipTraceMessageName: string[];
  shipActionTraceMessageName: string[];
  action: string[];
};

export type ContractDeltaMatchCriteria = MatchCriteria & {
  shipDeltaMessageName: string[];
  name: string[];
  code: string[];
  scope: string[];
  table: string[];
};
