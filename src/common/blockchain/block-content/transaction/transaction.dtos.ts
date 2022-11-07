export type PackedTrxDto = {
  signatures: string[];
  compression: number;
  packed_context_free_data: unknown;
  packed_trx: Uint8Array;
};
export type TrxByNameDto = [string, PackedTrxDto | string];

export type TransactionDto = {
  status: number;
  cpu_usage_us: number;
  net_usage_words: number;
  trx: TrxByNameDto;
};
