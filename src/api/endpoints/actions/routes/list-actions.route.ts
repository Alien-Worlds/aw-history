import { GetRoute, RouteHandler } from '@alien-worlds/api-core';
import { ListActionsInput } from '../domain/models/list-actions.input';
import { ListActionsOutput } from '../domain/models/list-actions.output';

/*imports*/

/**
 * @class
 *
 *
 */
export class ListActionsRoute extends GetRoute {
  public static create(handler: RouteHandler) {
    return new ListActionsRoute(handler);
  }

  private constructor(handler: RouteHandler) {
    super('actions', handler, {
      hooks: {
        pre: ListActionsInput.fromRequest,
        post: (output: ListActionsOutput) => output.toResponse(),
      },
    });
  }
}
