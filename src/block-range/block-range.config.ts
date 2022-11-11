import { BlockRangeScanConfig } from '../common/block-range-scanner';
import { BlockReaderConfig } from '../common/blockchain/block-reader';

export type BlockRangeConfig = {
  broadcast: {
    url: string;
    name?: string;
    fireAndForget?: boolean;
  };
  reader: BlockReaderConfig;
  mongo: { url: string; dbName: string };
  scanner: BlockRangeScanConfig;
  threads: number;
};
