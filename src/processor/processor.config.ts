import { FeaturedConfig } from '../common/featured';

export type ProcessorConfig = {
  broadcast: {
    url: string;
  };
  threads: number;
  featured: FeaturedConfig;
};
