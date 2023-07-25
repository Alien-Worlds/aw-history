import 'reflect-metadata';

import { ConfigVars, Route } from '@alien-worlds/api-core';
import { apiCommand } from './api.command';
import { ApiCommandOptions } from './api.types';
import { buildApiConfig } from '../config';
import { ApiDependencies } from './api.dependencies';

export const startApi = async (
  dependencies: ApiDependencies,
  routes: Route[] = [],
  ...args: string[]
) => {
  const { api } = dependencies;
  const vars = new ConfigVars();
  const options = apiCommand.parse(args).opts<ApiCommandOptions>();
  const config = buildApiConfig(vars, dependencies.databaseConfigBuilder, options);

  api.setup(config);

  routes.forEach(route => {
    Route.mount(api, route);
  });

  return api.start();
};
