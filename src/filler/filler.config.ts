import { BlockRangeScanConfig } from '../common/block-range-scanner';

export type FillerConfig = {
  broadcast: {
    url: string;
    channel: string;
  };
  blockchain: {
    endpoint: string;
    chainId: string;
  };
  scanner: BlockRangeScanConfig;
  mongo: { url: string; dbName: string };
  startBlock: bigint;
  endBlock: bigint;
  mode: string;
  traces: string;
  deltas: string;
};
