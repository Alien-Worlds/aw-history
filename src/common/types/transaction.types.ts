export type PackedTrx = {
  signatures: string[];
  compression: number;
  packed_context_free_data: unknown;
  packed_trx: Uint8Array;
};
export type TrxByName = [string, PackedTrx | string];

export type Transaction = {
  status: number;
  cpu_usage_us: number;
  net_usage_words: number;
  trx: TrxByName;
};
