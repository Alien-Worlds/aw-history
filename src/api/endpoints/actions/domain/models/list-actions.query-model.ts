import { MongoAggregateParams, MongoDB, QueryModel } from '@alien-worlds/api-core';

import { ListActionsInput } from './list-actions.input';

/*imports*/

/**
 * @class
 */
export class ListActionsQueryModel extends QueryModel {
  /**
   * @returns {ListActionsQueryModel}
   */
  public static create(input: ListActionsInput): ListActionsQueryModel {
    const {
      contract,
      name,
      account,
      startBlock,
      endBlock,
      startTimestamp,
      endTimestamp,
    } = input;

    return new ListActionsQueryModel(
      contract,
      name,
      account,
      startBlock,
      endBlock,
      startTimestamp,
      endTimestamp
    );
  }

  /**
   * @constructor
   * @private
   */
  private constructor(
    public readonly contract: string,
    public readonly name: string,
    public readonly account: string,
    public readonly startBlock: bigint,
    public readonly endBlock: bigint,
    public readonly startTimestamp: Date,
    public readonly endTimestamp: Date
  ) {
    super();
  }

  public toQueryParams(): MongoAggregateParams {
    const pipeline: object[] = [];
    const options: MongoDB.AggregateOptions = {};

    return { pipeline, options };
  }
}
