export type BlockNumberWithIdModel = {
  block_num?: unknown;
  block_id?: string;
};

export type BlockModel<
  BlockType = Uint8Array,
  TracesType = Uint8Array,
  DeltasType = Uint8Array
> = {
  head?: BlockNumberWithIdModel;
  this_block?: BlockNumberWithIdModel;
  last_irreversible?: BlockNumberWithIdModel;
  prev_block?: BlockNumberWithIdModel;
  block?: BlockType;
  traces?: TracesType;
  deltas?: DeltasType;
  abi_version?: string;
  [key: string]: unknown;
};
