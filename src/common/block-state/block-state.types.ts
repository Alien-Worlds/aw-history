export type BlockStateModel = {
  last_modified_timestamp: Date;
  block_number: bigint;
  actions: string[];
  tables: string[];
};

export type BlockStateEntity = {
  lastModifiedTimestamp: Date;
  blockNumber: bigint;
  actions: string[];
  tables: string[];
};
