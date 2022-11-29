export type AllocationType = {
  [key: string]: string;
};

export type FeaturedAllocationType = {
  [key: string]: string[];
};

export type FeaturedType = FeaturedAllocationType & {
  matcher?: string;
  processor: string;
};

export type OptionalTraceAllocation = {
  shipTraceMessageName?: string;
  shipActionTraceMessageName?: string;
  contract?: string;
  action?: string;
};

export type TraceAllocation = {
  shipTraceMessageName: string;
  shipActionTraceMessageName: string;
  contract: string;
  action: string;
};

export type FeaturedTraceAllocation = {
  shipTraceMessageName: string[];
  shipActionTraceMessageName: string[];
  contract: string[];
  action: string[];
};

export type FeaturedTrace = FeaturedTraceAllocation & {
  matcher?: string;
  processor: string;
};

export type OptionalDeltaAllocation = {
  shipDeltaMessageName?: string;
  name?: string;
  code?: string;
  scope?: string;
  table?: string;
};

export type DeltaAllocation = {
  shipDeltaMessageName: string;
  name: string;
  code: string;
  scope: string;
  table: string;
};

export type FeaturedDeltaAllocation = {
  shipDeltaMessageName: string[];
  name: string[];
  code: string[];
  scope: string[];
  table: string[];
};

export type FeaturedDelta = FeaturedDeltaAllocation & {
  matcher?: string;
  processor: string;
};

export type FeaturedConfig = {
  traces: FeaturedTrace[];
  deltas: FeaturedDelta[];
};

export type FeaturedMatchers = {
  traces?: FeaturedMatcher;
  deltas?: FeaturedMatcher;
};

export type PathLink = {
  link: string[][];
  path: string;
};

export type FeaturedMatcher = Map<string, MatchFunction>;

export type MatchFunction = (
  data: FeaturedAllocationType | AllocationType
) => Promise<TraceAllocation | DeltaAllocation | boolean>;
