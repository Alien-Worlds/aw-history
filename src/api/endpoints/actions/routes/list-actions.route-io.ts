import {
  IO,
  Response,
  RouteIO,
  UnknownObject,
  Request,
  parseToBigInt,
} from '@alien-worlds/aw-core';
import { ListActionsInput } from '../domain/models/list-actions.input';
import { ListActionsQueryParams } from '../domain/actions.types';
import { ListActionsOutput } from '../domain/models/list-actions.output';

export class ListActionsRouteIO implements RouteIO {
  public toResponse(output: ListActionsOutput): Response {
    const { result } = output;

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
      body: output.toJSON(),
    };
  }

  public fromRequest(
    request: Request<unknown, unknown, ListActionsQueryParams>
  ): ListActionsInput {
    const {
      query: { contracts, names, accounts, from, to, limit, offset, block_numbers },
    } = request;

    let fromBlock: bigint;
    let toBlock: bigint;
    let fromDate: Date;
    let toDate: Date;
    let blockNumbers = [];

    if (from) {
      if (/^[0-9]+$/.test(from)) {
        fromBlock = parseToBigInt(from);
      } else {
        fromDate = new Date(from);
      }
    }

    if (to) {
      if (/^[0-9]+$/.test(to)) {
        toBlock = parseToBigInt(to);
      } else {
        toDate = new Date(to);
      }
    }

    if (block_numbers) {
      blockNumbers = block_numbers.split(',').map(parseToBigInt);
    }

    return new ListActionsInput(
      contracts ? contracts.split(',') : [],
      names ? names.split(',') : [],
      accounts ? accounts.split(',') : [],
      fromBlock,
      toBlock,
      fromDate,
      toDate,
      blockNumbers,
      offset || 0,
      limit || 10
    );
  }
}
