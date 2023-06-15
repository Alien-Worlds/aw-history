import { Query, QueryBuilder } from '@alien-worlds/api-core';
import { MongoDB } from '@alien-worlds/storage-mongodb';

export type UpdateBlockNumberQueryArgs = { blockNumber: bigint };

export class UpdateBlockNumberMongoQueryBuilder extends QueryBuilder {
  public build(): Query {
    const { blockNumber } = this.args as UpdateBlockNumberQueryArgs;
    return {
      filter: {},
      update: {
        $max: { block_number: MongoDB.Long.fromBigInt(blockNumber) },
        $set: { last_modified_timestamp: new Date() },
      },
    };
  }
}
