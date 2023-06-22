import { BlockRangeScan } from './block-range-scan';
import { BlockRangeScanSource } from './block-range-scan.source';
import { Mapper } from '@alien-worlds/api-core';

export type ScanRequest = {
  error?: Error;
};

export class BlockRangeScanRepository {
  constructor(
    private readonly source: BlockRangeScanSource,
    private readonly mapper: Mapper<BlockRangeScan>,
    private readonly maxChunkSize: number
  ) {}

  public async startNextScan(scanKey: string): Promise<BlockRangeScan> {
    try {
      const document = await this.source.startNextScan(scanKey);
      return document ? this.mapper.toEntity(document) : null;
    } catch (error) {
      return null;
    }
  }

  public async createScanNodes(
    scanKey: string,
    startBlock: bigint,
    endBlock: bigint
  ): Promise<ScanRequest> {
    try {
      const { maxChunkSize } = this;

      const rootRange = BlockRangeScan.create(startBlock, endBlock, scanKey, 0);
      const rangesToPersist = [rootRange];
      const childRanges = BlockRangeScan.createChildRanges(rootRange, maxChunkSize);
      childRanges.forEach(range => rangesToPersist.push(range));

      const documents = rangesToPersist.map(range => this.mapper.fromEntity(range));
      await this.source.insert(documents);

      return {};
    } catch (error) {
      return { error: error as Error };
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
