/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { connectMongo, log, MongoConfig, MongoSource } from '@alien-worlds/api-core';
import { FeaturedConfig } from '../featured';
import { Abis } from './abis';
import { AbisCollection, AbisRepository } from './abis.repository';
import { AbisService } from './abis.service';
import { AbisServiceConfig } from './abis.types';

export const setupAbis = async (
  mongo: MongoSource | MongoConfig,
  abisConfig?: AbisServiceConfig,
  featured?: FeaturedConfig
): Promise<Abis> => {
  let mongoSource: MongoSource;

  log(` *  Abis ... [starting]`);

  if (mongo instanceof MongoSource) {
    mongoSource = mongo;
  } else {
    const db = await connectMongo(mongo);
    mongoSource = new MongoSource(db);
  }
  const collection = new AbisCollection(mongoSource);
  const repository = new AbisRepository(collection);
  const service = abisConfig ?  new AbisService(abisConfig) : null;
  const abis = new Abis(repository, service, featured);

  log(` *  Abis ... [ready]`);

  return abis;
};
