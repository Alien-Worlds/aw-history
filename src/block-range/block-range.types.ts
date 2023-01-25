import { FeaturedContractContent, FeaturedDelta, FeaturedTrace } from '../common/featured';
import { BlockRangeConfig } from './block-range.config';

export type BlockRangeSharedData = {
  config: BlockRangeConfig;
  featured: { traces: FeaturedTrace[]; deltas: FeaturedDelta[] };
};
