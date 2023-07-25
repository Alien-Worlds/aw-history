import 'reflect-metadata';

import { Route } from '@alien-worlds/api-core';
import { Api } from './api';

export const startApi = async <WebFramework = unknown>(
  api: Api<WebFramework>,
  routes: Route[] = []
) => {
  routes.forEach(route => {
    Route.mount(api, route);
  });

  return api.start();
};
