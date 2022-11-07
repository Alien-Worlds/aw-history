import { BlockRangeScan } from './block-range-scan';
import { BlockRangeScanRepository } from './block-range-scan.repository';

/**
 * @class
 */
export class BlockRangeScanner {
  constructor(private blockRangeScanRepository: BlockRangeScanRepository) {}

  public async createScanNodes(
    key: string,
    startBlock: bigint,
    endBlock: bigint
  ): Promise<boolean> {
    const hasScanKey = await this.blockRangeScanRepository.hasScanKey(
      key,
      startBlock,
      endBlock
    );

    if (hasScanKey) {
      return false;
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
    return this.blockRangeScanRepository.hasScanKey(key, startBlock, endBlock);
  }

  // public onScanComplete(handler: (scan: BlockRangeScan) => Promise<void>): void {}
}
