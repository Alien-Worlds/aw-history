import { MongoConfig } from '@alien-worlds/api-core';
import { AbisServiceConfig } from '../common/abis';
import { BroadcastMessageContentMapper } from '../common/broadcast';
import { FeaturedConfig, FeaturedMatchers } from '../common/featured';
import { WorkersConfig } from '../common/workers';
import { DeltaProcessorMessageContent } from './broadcast/delta-processor.message-content';
import { TraceProcessorMessageContent } from './broadcast/trace-processor.message-content';

export type ProcessorConfig = {
  broadcast: {
    url: string;
  };
  workers: WorkersConfig;
  featured: FeaturedConfig;
  abis: AbisServiceConfig;
  mongo: MongoConfig;
  sharedData?: unknown
};

export type ProcessorAddons = {
  traceProcessorMapper?: BroadcastMessageContentMapper<TraceProcessorMessageContent>,
  deltaProcessorMapper?: BroadcastMessageContentMapper<DeltaProcessorMessageContent>,
  matchers?: FeaturedMatchers
};
