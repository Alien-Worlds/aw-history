import {
  MongoConfig,
  MongoQueryBuilders,
  MongoSource,
} from '@alien-worlds/storage-mongodb';
import { Featured } from '../featured';
import {
  RepositoryImpl,
  SmartContractService,
  UnknownObject,
  log,
} from '@alien-worlds/api-core';
import { FeaturedContractMongoCollection } from './featured-contract.mongo.collection';
import { FeaturedContractMongoMapper } from './featured-contract.mongo.mapper';

export class FeaturedCreator {
  public static async create(
    mongo: MongoSource | MongoConfig,
    smartContractService: SmartContractService,
    featuredJson: UnknownObject
  ): Promise<Featured> {
    let mongoSource: MongoSource;

    log(` *  Featured ... [starting]`);

    if (mongo instanceof MongoSource) {
      mongoSource = mongo;
    } else {
      mongoSource = await MongoSource.create(mongo);
    }
    const repository = new RepositoryImpl(
      new FeaturedContractMongoCollection(mongoSource),
      new FeaturedContractMongoMapper(),
      new MongoQueryBuilders()
    );
    const featured = new Featured(repository, smartContractService, featuredJson);

    log(` *  Contract Reader ... [ready]`);

    return featured;
  }
}
