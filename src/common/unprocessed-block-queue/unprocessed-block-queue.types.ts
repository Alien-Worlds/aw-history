export type UnprocessedBlockQueueConfig = {
  maxBytesSize: number;
  batchSize: number;
  fastLaneBatchSize: number;
  sizeCheckInterval?: number;
  [key: string]: unknown;
};
