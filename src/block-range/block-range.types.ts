export type BlockRangeWorkerMessageContent = {
  startBlock: bigint;
  endBlock: bigint;
  scanKey: string;
};

export type BlockRangeMessageBuffer = {
  mode: string;
  scanKey: string;
  startBlock: bigint;
  endBlock: bigint;
};
