import { MongoCollectionSource, MongoSource } from '@alien-worlds/storage-mongodb';
import { ContractEncodedAbiDocument } from './abis.types';

/**
 * Represents a collection of ABIs (Application Binary Interfaces) stored in a MongoDB collection.
 * Extends the MongoCollectionSource class to provide database operations for the ABIs.
 */
export class AbisCollection extends MongoCollectionSource<ContractEncodedAbiDocument> {
  /**
   * Constructs a new instance of the AbisCollection class.
   *
   * @param {MongoSource} source - The MongoDB source used for database operations.
   */
  constructor(source: MongoSource) {
    super(source, 'history_tools.abis', {
      indexes: [
        { key: { block_number: 1, hex: 1, contract: 1 }, unique: true, background: true },
      ],
    });
  }
}
