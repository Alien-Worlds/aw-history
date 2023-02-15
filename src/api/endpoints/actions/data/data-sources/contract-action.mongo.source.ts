import {
  CollectionMongoSource,
  ContractAction,
  MongoSource,
} from '@alien-worlds/api-core';

/**
 * @class
 */
export class ContractActionMongoSource extends CollectionMongoSource<ContractAction> {
  /**
   * @constructor
   * @param {MongoSource} mongoSource
   */
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'actions');
  }
}
