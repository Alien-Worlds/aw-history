import {
  BroadcastMessage,
  ConfigVars,
  FeaturedContractDataCriteria,
  ProcessorAddons,
  ProcessorConfig,
  ProcessorDependencies,
  WorkerClass,
  WorkerPool,
  log,
} from '@alien-worlds/history-tools-common';
import { processorWorkerLoaderPath } from './processor.consts';
import { ProcessorRunner } from './processor.runner';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
  ProcessorBroadcastMessage,
} from '../broadcast';
import { processorCommand } from './processor.command';
import { buildProcessorConfig } from '../config';
import { ProcessorCommandOptions } from './processor.types';

/**
 *
 * @param featuredContent
 * @param broadcastMessageMapper
 * @param config
 */
export const process = async (
  config: ProcessorConfig,
  dependencies: ProcessorDependencies,
  processorClasses: Map<string, WorkerClass>,
  featuredCriteria: FeaturedContractDataCriteria,
  addons: ProcessorAddons = {}
) => {
  log(`Processor ... [starting]`);

  const initResult = await dependencies.initialize(
    config,
    featuredCriteria,
    processorClasses,
    addons
  );

  if (initResult.isFailure) {
    throw initResult.failure.error;
  }

  const { broadcastClient, featuredTraces, featuredDeltas, processorTaskQueue } =
    dependencies;
  const workerPool = await WorkerPool.create({
    ...config.workers,
    workerLoaderPath: config.processorLoaderPath || processorWorkerLoaderPath,
  });

  const runner = new ProcessorRunner(
    featuredTraces,
    featuredDeltas,
    workerPool,
    processorTaskQueue
  );

  broadcastClient.onMessage(
    InternalBroadcastChannel.Processor,
    async (message: BroadcastMessage) => {
      if (message.name === InternalBroadcastMessageName.ProcessorRefresh) {
        runner.next();
      }
    }
  );
  await broadcastClient.connect();
  // Everything is ready, notify the block-range that the process is ready to work
  broadcastClient.sendMessage(ProcessorBroadcastMessage.ready());

  // start processor in case the queue already contains tasks
  runner.next();

  log(`Processor ... [ready]`);
};

export const startProcessor = (
  args: string[],
  dependencies: ProcessorDependencies,
  processorClasses: Map<string, WorkerClass>,
  featuredCriteria: FeaturedContractDataCriteria,
  addons?: ProcessorAddons
) => {
  const vars = new ConfigVars();
  const options = processorCommand.parse(args).opts<ProcessorCommandOptions>();
  const config = buildProcessorConfig(vars, dependencies.databaseConfigBuilder, options);
  process(config, dependencies, processorClasses, featuredCriteria, addons).catch(log);
};
