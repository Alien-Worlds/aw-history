export type BlockReaderConfig = {
  endpoints: string[];
  reconnectInterval?: number;
  shouldFetchDeltas?: boolean;
  shouldFetchTraces?: boolean;
};
