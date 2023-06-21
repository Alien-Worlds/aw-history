import { log } from '@alien-worlds/api-core';
import { BlockRangeScanRepository } from './block-range-scan.repository';
import { BlockRangeScanConfig } from './block-range-scanner.config';
import { BlockRangeScanMongoSource } from './block-range-scan.mongo.source';
import { MongoConfig, MongoSource } from '@alien-worlds/storage-mongodb';
import { BlockRangeScanner } from './block-range-scanner';

/**
 * @class
 */
export class BlockRangeScannerCreator {
  public static async create(
    mongo: MongoSource | MongoConfig,
    config: BlockRangeScanConfig
  ): Promise<BlockRangeScanner> {
    let mongoSource: MongoSource;

    log(` *  Block Range Scanner ... [starting]`);

    if (mongo instanceof MongoSource) {
      mongoSource = mongo;
    } else {
      mongoSource = await MongoSource.create(mongo);
    }
    const source = new BlockRangeScanMongoSource(mongoSource);
    const repository = new BlockRangeScanRepository(source, config);
    const scanner: BlockRangeScanner = new BlockRangeScanner(repository);

    log(` *  Block Range Scanner ... [ready]`);
    return scanner;
  }
}
