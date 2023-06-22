import { ConfigVars, log } from '@alien-worlds/api-core';
import {
  ProcessorAddons,
  ProcessorCommandOptions,
  ProcessorConfig,
} from './processor.types';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
  ProcessorBroadcastMessage,
} from '../broadcast';
import { ProcessorRunner } from './processor.runner';
import { ProcessorDependencies } from './processor.dependencies';
import { processorCommand } from './processor.command';
import { buildProcessorConfig } from '../config';
import { BroadcastMessage } from '@alien-worlds/broadcast';
import { processorWorkerLoaderPath } from './processor.consts';
import { WorkerPool } from '@alien-worlds/workers';

/**
 *
 * @param featuredContent
 * @param broadcastMessageMapper
 * @param config
 */
export const process = async (
  config: ProcessorConfig,
  dependencies: ProcessorDependencies,
  addons: ProcessorAddons = {}
) => {
  log(`Processor ... [starting]`);

  const initResult = await dependencies.initialize(config, addons);

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
  addons?: ProcessorAddons
) => {
  const vars = new ConfigVars();
  const options = processorCommand.parse(args).opts<ProcessorCommandOptions>();
  const config = buildProcessorConfig(vars, options);
  process(config, dependencies, addons).catch(log);
};
