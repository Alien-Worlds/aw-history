import {
  MongoConfig,
  MongoSource,
  RepositoryImpl,
  Container,
} from '@alien-worlds/api-core';

import { ContractDeltaMongoSource } from './data/data-sources/contract-delta.mongo.source';
import { ContractDeltaMapper } from './data/mappers/contract-delta.mapper';
import { ContractDeltaRepository } from './domain/repositories/contract-delta.repository';

export const setupContractDeltaRepository = async (
  mongo: MongoSource | MongoConfig,
  container?: Container
): Promise<ContractDeltaRepository> => {
  let mongoSource: MongoSource;
  if (mongo instanceof MongoSource) {
    mongoSource = mongo;
  } else {
    mongoSource = await MongoSource.create(mongo);
  }

  const repo: ContractDeltaRepository = new RepositoryImpl(
    new ContractDeltaMongoSource(mongoSource),
    new ContractDeltaMapper()
  );

  if (container) {
    container
      .bind<ContractDeltaRepository>(ContractDeltaRepository.Token)
      .toConstantValue(repo);
  }

  return repo;
};
