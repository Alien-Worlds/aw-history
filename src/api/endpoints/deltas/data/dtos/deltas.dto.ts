export type ListDeltasRequestDto = {
  contract?: string;
  name?: string;
  account?: string;
  block_range?: { from?: number; to?: number };
  timestamp_range?: { from?: number; to?: number };
  offset?: number;
  limit?: number;
};
