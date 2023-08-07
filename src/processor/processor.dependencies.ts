import { Result, Serializer } from '@alien-worlds/aw-core';
import { Dependencies } from '../common/dependencies';
import {
  ContractDeltaMatchCriteria,
  ContractTraceMatchCriteria,
  Featured,
} from '../common/featured';
import { ProcessorTaskQueue } from '../common/processor-task-queue';
import { BroadcastClient } from '@alien-worlds/aw-broadcast';
import { ProcessorAddons, ProcessorConfig } from './processor.config';
import { DatabaseConfigBuilder } from '../common';

/**
 * An abstract class representing a Processor dependencies.
 * @class ProcessorDependencies
 */
export abstract class ProcessorDependencies extends Dependencies {
  public workerLoaderPath?: string;
  public workerLoaderDependenciesPath: string;
  public broadcastClient: BroadcastClient;
  public serializer: Serializer;
  public featuredTraces: Featured<ContractTraceMatchCriteria>;
  public featuredDeltas: Featured<ContractDeltaMatchCriteria>;
  public processorTaskQueue: ProcessorTaskQueue;
  public processorsPath: string;

  public databaseConfigBuilder: DatabaseConfigBuilder;

  public abstract initialize(
    config: ProcessorConfig,
    featuredCriteriaPath: string,
    processorsPath: string,
    addons?: ProcessorAddons
  ): Promise<Result>;
}
