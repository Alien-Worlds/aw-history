import { BlockRangeScan } from './block-range-scan';
import { BlockRangeScanMongoSource } from './block-range-scan.mongo.source';
import { BlockRangeScanConfig } from './block-range-scanner.config';

export class BlockRangeScanRepository {
  constructor(
    private readonly source: BlockRangeScanMongoSource,
    private readonly config: BlockRangeScanConfig
  ) {}

  public async startNextScan(scanKey: string): Promise<BlockRangeScan> {
    try {
      const document = await this.source.startNextScan(scanKey);
      return document ? BlockRangeScan.fromDocument(document) : null;
    } catch (error) {
      return null;
    }
  }

  public async createScanNodes(
    scanKey: string,
    startBlock: bigint,
    endBlock: bigint
  ): Promise<boolean> {
    try {
      const { numberOfChildren, minChunkSize } = this.config;

      const rootRange = BlockRangeScan.create(startBlock, endBlock, scanKey, 0);
      const rangesToPersist = [rootRange];
      const childRanges = BlockRangeScan.createChildRanges(
        rootRange,
        numberOfChildren,
        minChunkSize
      );
      childRanges.forEach(range => rangesToPersist.push(range));

      const documents = rangesToPersist.map(range => range.toDocument());
      await this.source.insertMany(documents);

      return true;
    } catch (error) {
      return false;
    }
  }

  public async countScanNodes(
    scanKey: string,
    startBlock: bigint,
    endBlock: bigint
  ): Promise<number> {
    try {
      return this.source.countScanNodes(scanKey, startBlock, endBlock);
    } catch (error) {
      return -1;
    }
  }

  public async removeAll(scanKey: string): Promise<void> {
    await this.source.removeAll(scanKey);
  }

  public async hasScanKey(
    scanKey: string,
    startBlock?: bigint,
    endBlock?: bigint
  ): Promise<boolean> {
    return this.source.hasScanKey(scanKey, startBlock, endBlock);
  }

  public async hasUnscannedNodes(
    scanKey: string,
    startBlock?: bigint,
    endBlock?: bigint
  ): Promise<boolean> {
    return this.source.hasUnscannedNodes(scanKey, startBlock, endBlock);
  }

  public async updateScannedBlockNumber(
    scanKey: string,
    blockNumber: bigint
  ): Promise<void> {
    await this.source.updateProcessedBlockNumber(scanKey, blockNumber);
  }
}
