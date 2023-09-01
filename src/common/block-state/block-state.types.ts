export type BlockStateEntity = {
  lastModifiedTimestamp: Date;
  blockNumber: bigint;
  actions: string[];
  tables: string[];
};
