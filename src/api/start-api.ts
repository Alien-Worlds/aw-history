import { Route } from '@alien-worlds/api-core';
import { Api } from './api';
import { ApiConfig } from './api.types';

export const startApi = async (config: ApiConfig, routes: Route[] = []) => {
  const api = new Api(config);

  routes.forEach(route => {
    Route.mount(api, route);
  });

  return api.start();
};
