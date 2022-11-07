import { Long } from 'mongodb';

export type BlockRangeScanIdDocument = {
  start: Long;
  end: Long;
  scan_key: string;
};

export type BlockRangeScanDocument = {
  _id: BlockRangeScanIdDocument;
  tree_depth: number;
  processed_block?: Long;
  time_stamp?: Date;
  is_leaf_node?: boolean;
  parent_id?: BlockRangeScanIdDocument;
};
