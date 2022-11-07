export type BlockNumberWithIdDto = {
  block_num: number;
  block_id: string;
};

export type GetBlocksResultDto = {
  head: BlockNumberWithIdDto;
  this_block: BlockNumberWithIdDto;
  last_irreversible: BlockNumberWithIdDto;
  prev_block: BlockNumberWithIdDto;
  block: Uint8Array;
  traces: Uint8Array;
  deltas: Uint8Array;
};
