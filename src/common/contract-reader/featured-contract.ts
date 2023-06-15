import {
  parseToBigInt,
  removeUndefinedProperties,
} from '@alien-worlds/api-core';
import { FeaturedContractDocument } from './contract-reader.dtos';
import { MongoDB } from '@alien-worlds/storage-mongodb';

export class FeaturedContract {
  /**
   * @constructor
   * @private
   * @param {string} id
   * @param {bigint} initialBlockNumber
   * @param {bigint} account
   */
  private constructor(
    public readonly id: string,
    public readonly initialBlockNumber: bigint,
    public readonly account: string
  ) {}

  public static create(account: string, initialBlockNumber: string | number) {
    return new FeaturedContract('', parseToBigInt(initialBlockNumber), account);
  }

  public static fromDocument(document: FeaturedContractDocument) {
    const { initial_block_number, _id, account } = document;

    return new FeaturedContract(
      _id ? _id.toString() : '',
      parseToBigInt(initial_block_number),
      account
    );
  }

  public toDocument() {
    const { id, initialBlockNumber, account } = this;
    const doc: FeaturedContractDocument = {
      initial_block_number: MongoDB.Long.fromBigInt(initialBlockNumber),
      account,
    };

    if (id) {
      doc._id = new MongoDB.ObjectId(id);
    }

    return removeUndefinedProperties(doc);
  }
}
