import { ContractAction } from '@alien-worlds/api-core';
import { MongoCollectionSource, MongoSource } from '@alien-worlds/storage-mongodb';

/**
 * @class
 */
export class ContractActionMongoSource extends MongoCollectionSource<ContractAction> {
  /**
   * @constructor
   * @param {MongoSource} mongoSource
   */
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'actions');
  }
}
