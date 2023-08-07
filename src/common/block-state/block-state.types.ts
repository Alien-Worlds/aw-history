export type BlockStateModel = {
  lastModifiedTimestamp: Date;
  blockNumber: bigint;
  actions: string[];
  tables: string[];
};
