export type AllocationType = {
  [key: string]: string;
};

export type FeaturedAllocationType = {
  [key: string]: string[];
};

export type FeaturedType = FeaturedAllocationType & {
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
  processor: string;
};

export type OptionalDeltaAllocation = {
  version?: string;
  name?: string;
  code?: string;
  scope?: string;
  table?: string;
};

export type DeltaAllocation = {
  version: string;
  name: string;
  code: string;
  scope: string;
  table: string;
};

export type FeaturedDeltaAllocation = {
  version: string[];
  name: string[];
  code: string[];
  scope: string[];
  table: string[];
};

export type FeaturedDelta = FeaturedDeltaAllocation & {
  processor: string;
};

export type FeaturedConfig = {
  traces: FeaturedTrace[];
  deltas: FeaturedDelta[];
};

export type PathLink = {
  link: string[][];
  path: string;
};
