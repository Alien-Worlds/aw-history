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
};
