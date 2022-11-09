export type FeaturedDelta = {
  type: string;
  name: string;
  codes: Set<string>;
  scopes: Set<string>;
  tables: Set<string>;
};

export type FeaturedTrace = {
  type: string;
  actionTracesVersion: string;
  contracts: Set<string>;
  actions: Set<string>;
};

export type BlockRangeWorkerMessageContent = {
  startBlock: bigint;
  endBlock: bigint;
  scanKey: string;
};

export type BlockRangeMessageBuffer = {
  mode: string;
  scanKey: string;
  featuredTraces: FeaturedTrace[];
  featuredDeltas: FeaturedDelta[];
  startBlock: bigint;
  endBlock: bigint;
};
