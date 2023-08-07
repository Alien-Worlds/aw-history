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

export type ContractTraceMatchCriteria = MatchCriteria & {
  shipTraceMessageName: string[];
  shipActionTraceMessageName: string[];
  contract: string[];
  action: string[];
};

export type ContractDeltaMatchCriteria = MatchCriteria & {
  shipDeltaMessageName: string[];
  name: string[];
  code: string[];
  scope: string[];
  table: string[];
};

export type FeaturedContractDataCriteria = {
  traces: ProcessorMatchCriteria<ContractTraceMatchCriteria>[];
  deltas: ProcessorMatchCriteria<ContractDeltaMatchCriteria>[];
};
