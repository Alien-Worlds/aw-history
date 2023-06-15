export type PackedTrxJson = {
  signatures: string[];
  compression: number;
  packed_context_free_data: unknown;
  packed_trx: Uint8Array;
};
export type TrxByNameJson = [string, PackedTrxJson | string];

export type TransactionJson = {
  status: number;
  cpu_usage_us: number;
  net_usage_words: number;
  trx: TrxByNameJson;
};
