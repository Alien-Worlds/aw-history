export type UnprocessedBlockQueueConfig = {
  maxBytesSize: number;
  batchSize: number;
  fastLaneBatchSize: number;
  sizeCheckInterval?: number;
  [key: string]: unknown;
};

export type InsertionResult = {
  insertedBlocks: bigint[];
  failedBlocks: bigint[];
  queueOverloadSize: number;
};
