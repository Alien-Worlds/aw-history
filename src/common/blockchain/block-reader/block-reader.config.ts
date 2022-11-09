export type BlockReaderConfig = {
  endpoints: string[];
  shouldFetchDeltas?: boolean;
  shouldFetchTraces?: boolean;
};
