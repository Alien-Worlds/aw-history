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
import { log, ConfigVars } from '@alien-worlds/aw-core';
import { BroadcastMessage } from '@alien-worlds/aw-broadcast';
import { WorkerPool } from '@alien-worlds/aw-workers';
import { ProcessorConfig, ProcessorAddons } from './processor.config';
import { ProcessorDependencies } from './processor.dependencies';

export const process = async (
  config: ProcessorConfig,
  dependencies: ProcessorDependencies,
  processorsPath: string,
  featuredCriteriaPath: string,
  addons: ProcessorAddons = {}
) => {
  log(`Processor ... [starting]`);

  const initResult = await dependencies.initialize(
    config,
    featuredCriteriaPath,
    processorsPath,
    addons
  );

  if (initResult.isFailure) {
    throw initResult.failure.error;
  }

  const {
    broadcastClient,
    featuredTraces,
    featuredDeltas,
    processorTaskQueue,
    workerLoaderDependenciesPath,
    serializer,
  } = dependencies;
  const workerPool = await WorkerPool.create({
    ...config.workers,
    sharedData: { config, featuredCriteriaPath, processorsPath },
    workerLoaderPath: config.processorLoaderPath || processorWorkerLoaderPath,
    workerLoaderDependenciesPath,
  });
  const runner = new ProcessorRunner(
    featuredTraces,
    featuredDeltas,
    workerPool,
    processorTaskQueue,
    serializer
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
  processorsPath: string,
  featuredCriteriaPath: string,
  addons?: ProcessorAddons
) => {
  const vars = new ConfigVars();
  const options = processorCommand.parse(args).opts<ProcessorCommandOptions>();
  const config = buildProcessorConfig(vars, dependencies.databaseConfigBuilder, options);
  process(config, dependencies, processorsPath, featuredCriteriaPath, addons).catch(log);
};
