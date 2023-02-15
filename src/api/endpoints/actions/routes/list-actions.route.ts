import { GetRoute, Request, Result, RouteHandler } from '@alien-worlds/api-core';
import { ListActionsInput } from '../domain/models/list-actions.input';
import { ListActionsOutput } from '../domain/models/list-actions.output';
import { ListActionsRequestDto } from '../data/dtos/actions.dto';

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
        pre: parseRequestToControllerInput,
        post: parseResultToControllerOutput,
      },
    });
  }
}

/**
 *
 * @param {Request} request
 * @returns
 */
export const parseRequestToControllerInput = (
  request: Request<ListActionsRequestDto>
) => {
  // parse DTO (query) to the options required by the controller method
  return ListActionsInput.fromRequest(request);
};

/**
 *
 * @param {Result<ListActionsOutput>} result
 * @returns
 */
export const parseResultToControllerOutput = (result: Result<ListActionsOutput>) => {
  if (result.isFailure) {
    const {
      failure: { error },
    } = result;
    if (error) {
      return {
        status: 500,
        body: [],
      };
    }
  }

  return {
    status: 200,
    body: result.content.toJson(),
  };
};
