import { Result } from '@alien-worlds/api-core';
import { Dependencies } from '../common/dependencies';
import { BroadcastClient } from '@alien-worlds/broadcast';
import { ProcessorAddons, ProcessorConfig } from './processor.types';
import {
  ContractTraceMatchCriteria,
  ContractDeltaMatchCriteria,
  FeaturedMapper,
  ProcessorTaskQueue,
} from '../common';

/**
 * An abstract class representing a Processor dependencies.
 * @class ProcessorDependencies
 */
export abstract class ProcessorDependencies extends Dependencies {
  public broadcastClient: BroadcastClient;
  public featuredTraces: FeaturedMapper<ContractTraceMatchCriteria>;
  public featuredDeltas: FeaturedMapper<ContractDeltaMatchCriteria>;
  public processorTaskQueue: ProcessorTaskQueue;

  public abstract initialize(
    config: ProcessorConfig,
    addons?: ProcessorAddons
  ): Promise<Result>;
}
