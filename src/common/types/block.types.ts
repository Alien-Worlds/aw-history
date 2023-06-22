export type BlockNumberWithId = {
  block_num?: unknown;
  block_id?: string;
};

export type BlockModel<
  BlockType = Uint8Array,
  TracesType = Uint8Array,
  DeltasType = Uint8Array
> = {
  head?: BlockNumberWithId;
  this_block?: BlockNumberWithId;
  last_irreversible?: BlockNumberWithId;
  prev_block?: BlockNumberWithId;
  block?: BlockType;
  traces?: TracesType;
  deltas?: DeltasType;
  abi_version?: string;
  [key: string]: unknown;
};
