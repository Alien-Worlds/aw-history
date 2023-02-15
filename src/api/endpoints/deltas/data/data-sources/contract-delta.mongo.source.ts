import {
  CollectionMongoSource,
  ContractDelta,
  MongoSource,
} from '@alien-worlds/api-core';

/**
 * @class
 */
export class ContractDeltaMongoSource extends CollectionMongoSource<ContractDelta> {
  /**
   * @constructor
   * @param {MongoSource} mongoSource
   */
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'deltas');
  }
}
