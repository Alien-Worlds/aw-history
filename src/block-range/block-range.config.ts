import { BlockRangeScanConfig } from '../common/block-range-scanner';
import { BlockReaderConfig } from '../common/blockchain/block-reader';

export type BlockRangeConfig = {
  broadcast: {
    url: string;
  };
  reader: BlockReaderConfig;
  mongo: { url: string; dbName: string };
  scanner: BlockRangeScanConfig;
  threads: number;
};

export const blockRangeConfig: BlockRangeConfig = {
  broadcast: {
    url: '',
  },
  reader: { shipEndpoints: [] },
  mongo: { url: '', dbName: '' },
  scanner: { numberOfChildren: 10, minChunkSize: 5000, scanKey: '' },
  threads: 10,
};
