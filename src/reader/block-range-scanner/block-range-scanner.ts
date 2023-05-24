import { MongoConfig, MongoSource, log } from '@alien-worlds/api-core';
import { BlockRangeScan } from './block-range-scan';
import { BlockRangeScanRepository, ScanRequest } from './block-range-scan.repository';
import { DuplicateBlockRangeScanError } from './block-range-scanner.errors';
import { BlockRangeScanConfig } from './block-range-scanner.config';
import { BlockRangeScanMongoSource } from './block-range-scan.mongo.source';

/**
 * @class
 */
export class BlockRangeScanner {
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

  constructor(private blockRangeScanRepository: BlockRangeScanRepository) {}

  public async createScanNodes(
    key: string,
    startBlock: bigint,
    endBlock: bigint
  ): Promise<ScanRequest> {
    const hasScanKey = await this.blockRangeScanRepository.hasScanKey(
      key,
      startBlock,
      endBlock
    );

    if (hasScanKey) {
      return { error: new DuplicateBlockRangeScanError(key, startBlock, endBlock) };
    }

    return this.blockRangeScanRepository.createScanNodes(key, startBlock, endBlock);
  }

  public async getNextScanNode(key: string): Promise<BlockRangeScan> {
    return this.blockRangeScanRepository.startNextScan(key);
  }

  public async hasUnscannedBlocks(
    key: string,
    startBlock?: bigint,
    endBlock?: bigint
  ): Promise<boolean> {
    return this.blockRangeScanRepository.hasUnscannedNodes(key, startBlock, endBlock);
  }

  public async updateScanProgress(scanKey: string, blockNumber: bigint): Promise<void> {
    await this.blockRangeScanRepository.updateScannedBlockNumber(scanKey, blockNumber);
  }
}
