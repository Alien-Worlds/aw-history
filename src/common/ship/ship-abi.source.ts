/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  CollectionMongoSource,
  Failure,
  MongoDB,
  MongoSource,
  Result,
} from '@alien-worlds/api-core';
import { AbiNotFoundError } from '../blockchain/block-reader/block-reader.errors';
import { Abi } from '../blockchain/abi';

export type ShipAbiDocument = {
  _id?: MongoDB.ObjectId;
  last_modified_timestamp: Date;
  version: string;
  abi: string;
};

export class ShipAbiSource {
  private collection: CollectionMongoSource<ShipAbiDocument>;

  constructor(mongoSource: MongoSource) {
    this.collection = new CollectionMongoSource(mongoSource, 'history_tools.ship_abis');
  }

  public async updateAbi(abi: Abi): Promise<Result<void>> {
    try {
      await this.collection.update({
        version: abi.version,
        last_modified_timestamp: new Date(),
        abi: abi.toHex(),
      });

      return Result.withoutContent();
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  public async getAbi(version: string): Promise<Result<Abi>> {
    try {
      const document = await this.collection.findOne({ filter: { version } });

      if (document) {
        return Result.withContent(Abi.fromHex(document.abi));
      }
      return Result.withFailure(Failure.fromError(new AbiNotFoundError()));
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }
}
