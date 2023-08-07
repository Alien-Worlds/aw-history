export type ReaderCommandOptions = {
  startBlock?: bigint;
  endBlock?: bigint;
  mode?: string;
  scanKey?: string;
  threads?: number;
};

export type ReadTaskData = {
  startBlock?: bigint;
  endBlock?: bigint;
  mode?: string;
  scanKey?: string;
};

export type ReadCompleteData = {
  startBlock?: bigint;
  endBlock?: bigint;
  scanKey?: string;
};

export type ReadProgressData = {
  min?: bigint;
  max?: bigint;
};
