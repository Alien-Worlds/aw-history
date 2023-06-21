import {
  MongoConfig,
  MongoQueryBuilders,
  MongoSource,
} from '@alien-worlds/storage-mongodb';
import { AbisServiceConfig } from './abis.types';
import { Abis } from './abis';
import { AbiService, log } from '@alien-worlds/api-core';
import { AbisCollection } from './abis.collection';
import { AbisRepositoryImpl } from './abis.repository-impl';
import { AbisMongoMapper } from './abis.mongo.mapper';

export class AbisCreator {
  public static async create(
    mongo: MongoSource | MongoConfig,
    abiService: AbiService,
    contracts?: string[],
    setCache?: boolean
  ): Promise<Abis> {
    let mongoSource: MongoSource;

    log(` *  Abis ... [starting]`);

    if (mongo instanceof MongoSource) {
      mongoSource = mongo;
    } else {
      mongoSource = await MongoSource.create(mongo);
    }
    const mapper = new AbisMongoMapper();
    const repository = new AbisRepositoryImpl(
      new AbisCollection(mongoSource),
      mapper,
      new MongoQueryBuilders(mapper)
    );
    const abis = new Abis(repository, abiService, contracts);

    if (setCache) {
      await abis.cacheAbis();
      log(` *  Abis cache restored`);
    }

    log(` *  Abis ... [ready]`);

    return abis;
  }
}
