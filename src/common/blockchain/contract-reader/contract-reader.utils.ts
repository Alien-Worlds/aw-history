import { connectMongo, log, MongoConfig, MongoSource } from '@alien-worlds/api-core';
import { ContractReader, ContractReaderService } from './contract-reader';
import { ContractReaderConfig } from './contract-reader.config';
import { FeaturedContractSource } from './featured-contract.source';

export const setupContractReader = async (
  config: ContractReaderConfig,
  mongo: MongoSource | MongoConfig
): Promise<ContractReader> => {
  let mongoSource: MongoSource;

  log(` *  Contract Reader ... [starting]`);

  if (mongo instanceof MongoSource) {
    mongoSource = mongo;
  } else {
    const db = await connectMongo(mongo);
    mongoSource = new MongoSource(db);
  }
  const source = new FeaturedContractSource(mongoSource);
  const contractReader = new ContractReaderService(source, config);

  log(` *  Contract Reader ... [ready]`);

  return contractReader;
};
