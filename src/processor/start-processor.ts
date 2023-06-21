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

  await dependencies.initialize(config);

  const { broadcastClient } = dependencies;
  const runner = await ProcessorRunner.getInstance(config, addons);

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
