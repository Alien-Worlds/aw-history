import 'reflect-metadata';

import { ConfigVars, Route } from '@alien-worlds/aw-core';
import { apiCommand } from './api.command';
import { ApiCommandOptions } from './api.types';
import { buildApiConfig } from '../config';
import { ApiDependencies } from './api.dependencies';

export const startApi = async (dependencies: ApiDependencies, ...args: string[]) => {
  const { api, ioc, databaseConfigBuilder, routesProvider, setupIoc } = dependencies;
  const vars = new ConfigVars();
  const options = apiCommand.parse(args).opts<ApiCommandOptions>();
  const config = buildApiConfig(vars, databaseConfigBuilder, options);

  await setupIoc(config, ioc);

  api.setup(config);

  routesProvider(ioc).forEach(route => {
    Route.mount(api.framework, route);
  });

  return api.start();
};
