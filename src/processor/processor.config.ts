import { MongoConfig } from '@alien-worlds/api-core';
import { AbisServiceConfig } from '../common/abis';
import { BroadcastConfig, BroadcastMessageContentMapper } from '../common/broadcast';
import { FeaturedConfig, FeaturedMatchers } from '../common/featured';
import { WorkersConfig } from '../common/workers';
import { DeltaProcessorTaskMessageContent } from './broadcast/delta-processor-task.message-content';
import { ProcessorMessageContent } from './broadcast/processor.message-content';
import { TraceProcessorTaskMessageContent } from './broadcast/trace-processor-task.message-content';

export type ProcessorConfig = {
  broadcast: BroadcastConfig;
  workers: WorkersConfig;
  featured: FeaturedConfig;
  abis: AbisServiceConfig;
  mongo: MongoConfig;
  sharedData?: unknown;
};

export type ProcessorAddons = {
  traceProcessorMapper?: BroadcastMessageContentMapper<TraceProcessorTaskMessageContent>;
  deltaProcessorMapper?: BroadcastMessageContentMapper<DeltaProcessorTaskMessageContent>;
  orchestratorMapper?: BroadcastMessageContentMapper<ProcessorMessageContent>;
  matchers?: FeaturedMatchers;
};
