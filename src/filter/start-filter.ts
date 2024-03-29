import { FilterAddons, FilterCommandOptions } from './filter.types';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
  ProcessorBroadcastMessage,
} from '../broadcast';
import { FilterRunner } from './filter.runner';
import { FilterBroadcastMessage } from '../broadcast/messages/filter-broadcast.message';
import { buildFilterConfig } from '../config';
import { filterCommand } from './filter.command';
import { filterWorkerLoaderPath } from './filter.consts';
import { log, ConfigVars } from '@alien-worlds/aw-core';
import { BroadcastMessage } from '@alien-worlds/aw-broadcast';
import { WorkerPool } from '@alien-worlds/aw-workers';
import { FilterConfig } from './filter.config';
import { FilterDependencies } from './filter.dependencies';

export const filter = async (
  config: FilterConfig,
  dependencies: FilterDependencies,
  featuredCriteriaPath: string,
  addons?: FilterAddons
) => {
  log(`Filter ... [starting]`);
  const { matchers } = addons || {};
  const initResult = await dependencies.initialize(config, addons);

  if (initResult.isFailure) {
    throw initResult.failure.error;
  }

  const {
    broadcastClient,
    unprocessedBlockQueue,
    workerLoaderPath,
    workerLoaderDependenciesPath,
  } = dependencies;

  const workerPool = await WorkerPool.create({
    ...config.workers,
    sharedData: { config, matchers, featuredCriteriaPath },
    workerLoaderPath: workerLoaderPath || filterWorkerLoaderPath,
    workerLoaderDependenciesPath,
  });

  const runner = new FilterRunner(workerPool, unprocessedBlockQueue);

  runner.onTransition(() => {
    broadcastClient.sendMessage(ProcessorBroadcastMessage.refresh());
  });
  workerPool.onWorkerRelease(() => runner.next());
  broadcastClient.onMessage(
    InternalBroadcastChannel.Filter,
    async (message: BroadcastMessage) => {
      if (message.name === InternalBroadcastMessageName.FilterRefresh) {
        runner.next();
      }
    }
  );
  await broadcastClient.connect();
  // Everything is ready, notify bootstrap that the process is ready to work
  broadcastClient.sendMessage(FilterBroadcastMessage.ready());

  // start filter in case the queue already contains blocks
  runner.next();

  log(`Filter ... [ready]`);
};

export const startFilter = (
  args: string[],
  dependencies: FilterDependencies,
  featuredCriteriaPath: string,
  addons?: FilterAddons
) => {
  const vars = new ConfigVars();
  const options = filterCommand.parse(args).opts<FilterCommandOptions>();
  const config = buildFilterConfig(vars, dependencies.databaseConfigBuilder, options);

  filter(config, dependencies, featuredCriteriaPath, addons).catch(log);
};
