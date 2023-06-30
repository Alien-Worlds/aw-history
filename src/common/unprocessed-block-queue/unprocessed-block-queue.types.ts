export type UnprocessedBlockQueueConfig = {
  maxBytesSize: number;
  batchSize: number;
  sizeCheckInterval?: number;
  [key: string]: unknown;
};
