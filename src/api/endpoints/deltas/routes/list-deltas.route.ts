import { GetRoute, Request, Result, RouteHandler } from '@alien-worlds/api-core';
import { ListDeltasInput } from '../domain/models/list-deltas.input';
import { ListDeltasOutput } from '../domain/models/list-deltas.output';
import { ListDeltasRequestDto } from '../data/dtos/deltas.dto';

/*imports*/

/**
 * @class
 *
 *
 */
export class ListDeltasRoute extends GetRoute {
  public static create(handler: RouteHandler) {
    return new ListDeltasRoute(handler);
  }

  private constructor(handler: RouteHandler) {
    super('deltas', handler, {
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
export const parseRequestToControllerInput = (request: Request<ListDeltasRequestDto>) => {
  // parse DTO (query) to the options required by the controller method
  return ListDeltasInput.fromRequest(request);
};

/**
 *
 * @param {Result<ListDeltasOutput>} result
 * @returns
 */
export const parseResultToControllerOutput = (result: Result<ListDeltasOutput>) => {
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
