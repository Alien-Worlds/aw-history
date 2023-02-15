import { MongoAggregateParams, MongoDB, QueryModel } from '@alien-worlds/api-core';

import { ListDeltasInput } from './list-deltas.input';

/*imports*/

/**
 * @class
 */
export class ListDeltasQueryModel extends QueryModel {
  /**
   * @returns {ListDeltasQueryModel}
   */
  public static create(input: ListDeltasInput): ListDeltasQueryModel {
    const {
      contract,
      name,
      account,
      startBlock,
      endBlock,
      startTimestamp,
      endTimestamp,
    } = input;

    return new ListDeltasQueryModel(
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
