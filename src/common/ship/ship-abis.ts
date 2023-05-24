import { MongoConfig, MongoSource, Result, isMongoConfig } from '@alien-worlds/api-core';
import { ShipAbiSource } from './ship-abi.source';
import { Abi } from '../blockchain/abi';

export class ShipAbis {
  public static async create(mongo: MongoConfig | MongoSource) {
    let mongoSource;

    if (isMongoConfig(mongo)) {
      mongoSource = await MongoSource.create(mongo);
    } else {
      mongoSource = mongo;
    }

    return new ShipAbis(new ShipAbiSource(mongoSource));
  }

  private cache: Map<string, Abi> = new Map();

  private constructor(private mongo: ShipAbiSource) {}

  public async getAbi(version: string): Promise<Result<Abi>> {
    if (this.cache.has(version)) {
      return Result.withContent(this.cache.get(version));
    }

    const result = await this.mongo.getAbi(version);

    if (result.isFailure) {
      return result;
    }

    this.cache.set(version, result.content);

    return result;
  }
}
