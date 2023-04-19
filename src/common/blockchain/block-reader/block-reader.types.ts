import { BlockReaderConnectionState } from './block-reader.enums';

export type ConnectionChangeHandlerOptions = {
  previousState: BlockReaderConnectionState;
  state: BlockReaderConnectionState;
  data: string;
};

export type ConnectionChangeHandler = (
  options: ConnectionChangeHandlerOptions
) => void | Promise<void>;

export type BlockReaderOptions = {
  shouldFetchDeltas?: boolean;
  shouldFetchTraces?: boolean;
  shouldFetchBlock?: boolean;
};

export type GetBlocksResultMessageContent = {
  head?: {
    block_num: number;
    block_id: string;
  };
  last_irreversible?: {
    block_num: number;
    block_id: string;
  };
  this_block?: {
    block_num: number;
    block_id: string;
  };
  prev_block?: {
    block_num: number;
    block_id: string;
  };
  block?: Uint8Array;
  traces?: Uint8Array;
  deltas?: Uint8Array;
  [key: string]: unknown;
};
