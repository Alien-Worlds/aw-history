import { connectMongo, MongoConfig, MongoSource } from '@alien-worlds/api-core';
import { BlockRangeScanMongoSource } from './block-range-scan.mongo.source';
import { BlockRangeScanRepository } from './block-range-scan.repository';
import { BlockRangeScanner } from './block-range-scanner';
import { BlockRangeScanConfig } from './block-range-scanner.config';

export const setupBlockRangeScanner = async (
  mongo: MongoSource | MongoConfig,
  config: BlockRangeScanConfig
): Promise<BlockRangeScanner> => {
  let mongoSource: MongoSource;
  if (mongo instanceof MongoSource) {
    mongoSource = mongo;
  } else {
    const db = await connectMongo(mongo);
    mongoSource = new MongoSource(db);
  }
  const source = new BlockRangeScanMongoSource(mongoSource);
  const repository = new BlockRangeScanRepository(source, config);
  const scanner: BlockRangeScanner = new BlockRangeScanner(repository);

  return scanner;
};
