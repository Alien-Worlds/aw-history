import {
  MongoConfig,
  MongoQueryBuilders,
  MongoSource,
} from '@alien-worlds/storage-mongodb';
import { Featured } from './featured';
import { RepositoryImpl, SmartContractService, log } from '@alien-worlds/api-core';
import { FeaturedContractCollection } from './featured-contract.collection';
import { FeaturedContractMongoMapper } from './featured-contract.mongo.mapper';

export class FeaturedCreator {
  public static async create(
    mongo: MongoSource | MongoConfig,
    smartContractService: SmartContractService
  ): Promise<Featured> {
    let mongoSource: MongoSource;

    log(` *  Featured ... [starting]`);

    if (mongo instanceof MongoSource) {
      mongoSource = mongo;
    } else {
      mongoSource = await MongoSource.create(mongo);
    }
    const repository = new RepositoryImpl(
      new FeaturedContractCollection(mongoSource),
      new FeaturedContractMongoMapper(),
      new MongoQueryBuilders()
    );
    const featured = new Featured(repository, smartContractService);

    log(` *  Contract Reader ... [ready]`);

    return featured;
  }
}
