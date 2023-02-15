import {
  MongoConfig,
  MongoSource,
  RepositoryImpl,
  Container,
} from '@alien-worlds/api-core';

import { ContractActionMongoSource } from './data/data-sources/contract-action.mongo.source';
import { ContractActionMapper } from './data/mappers/contract-action.mapper';
import { ContractActionRepository } from './domain/repositories/contract-action.repository';

export const setupContractActionRepository = async (
  mongo: MongoSource | MongoConfig,
  container?: Container
): Promise<ContractActionRepository> => {
  let mongoSource: MongoSource;
  if (mongo instanceof MongoSource) {
    mongoSource = mongo;
  } else {
    mongoSource = await MongoSource.create(mongo);
  }

  const repo: ContractActionRepository = new RepositoryImpl(
    new ContractActionMongoSource(mongoSource),
    new ContractActionMapper()
  );

  if (container) {
    container
      .bind<ContractActionRepository>(ContractActionRepository.Token)
      .toConstantValue(repo);
  }

  return repo;
};
