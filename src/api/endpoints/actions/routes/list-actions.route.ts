import { GetRoute, RouteHandler } from '@alien-worlds/aw-core';
import { ListActionsRouteIO } from './list-actions.route-io';

export class ListActionsRoute extends GetRoute {
  public static create(handler: RouteHandler) {
    return new ListActionsRoute(handler);
  }

  private constructor(handler: RouteHandler) {
    super('actions', handler, {
      io: new ListActionsRouteIO(),
    });
  }
}
