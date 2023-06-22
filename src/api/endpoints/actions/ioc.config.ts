import { RepositoryImpl, Container } from '@alien-worlds/api-core';

import { ContractActionMongoSource } from '../../__dependencies__/contract-action.mongo.source';
import { ContractActionMapper } from '../../__dependencies__/contract-action.mongo.mapper';
import { ContractActionRepository } from './domain/repositories/contract-action.repository';
import {
  MongoConfig,
  MongoQueryBuilders,
  MongoSource,
} from '@alien-worlds/storage-mongodb';

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
    new ContractActionMapper(),
    new MongoQueryBuilders()
  );

  if (container) {
    container
      .bind<ContractActionRepository>(ContractActionRepository.Token)
      .toConstantValue(repo);
  }

  return repo;
};
