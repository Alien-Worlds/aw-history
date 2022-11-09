import { Long } from 'mongodb';

export type BlockRangeScanIdDocument = {
  start: Long;
  end: Long;
  scan_key: string;
  tree_depth: number;
};

export type BlockRangeScanDocument = {
  _id: BlockRangeScanIdDocument;
  processed_block?: Long;
  timestamp?: Date;
  start_timestamp?: Date;
  end_timestamp?: Date;
  is_leaf_node?: boolean;
  parent_id?: BlockRangeScanIdDocument;
};
