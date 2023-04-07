import { ListActionsQueryParams } from '../../data/dtos/actions.dto';
import {
  Request,
  parseToBigInt,
  QueryModel,
  MongoAggregateParams,
} from '@alien-worlds/api-core';
/**
 * @class
 */
export class ListActionsInput implements QueryModel {
  /**
   *
   * @param {ListActionsRequestDto} dto
   * @returns {ListActionsInput}
   */
  public static fromRequest(
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
  /**
   *
   * @constructor
   * @private
   */
  private constructor(
    public readonly contracts: string[],
    public readonly names: string[],
    public readonly accounts: string[],
    public readonly startBlock: bigint,
    public readonly endBlock: bigint,
    public readonly startTimestamp: Date,
    public readonly endTimestamp: Date,
    public readonly blockNumbers: bigint[],
    public readonly offset: number,
    public readonly limit: number
  ) {}

  public toQueryParams(): MongoAggregateParams {
    const {
      contracts,
      names,
      accounts,
      startBlock,
      endBlock,
      startTimestamp,
      endTimestamp,
      offset,
      limit,
    } = this;
    // TODO: use unions and represent it in special collection called ActionRepository 
    // it should contain all structs
    const pipeline = [
      { $match: { field: 'value' } },
      { $project: { field: 1 } },
      { $skip: 1 },
      { $limit: 5 },
      {
        $unionWith: {
          coll: 'collection2',
          pipeline: [
            { $match: { otherField: 'otherValue' } },
            { $project: { otherField: 1 } },
            { $skip: 1 },
            { $limit: 5 },
          ],
        },
      },
    ];
    const options = {};

    return {
      pipeline,
      options,
    };
  }
}
