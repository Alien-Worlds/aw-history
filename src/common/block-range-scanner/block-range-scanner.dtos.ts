import { Long } from 'mongodb';

/*
  We need to keep tree_depth in _id because if the entire scan will use only one node,
  we will not be able to create a child document with the same _id and tree_depth: 1.
*/

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
