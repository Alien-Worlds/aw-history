export type BlockReaderConfig = {
  shipEndpoints: string[];
  shouldFetchDeltas?: boolean;
  shouldFetchTraces?: boolean;
};
