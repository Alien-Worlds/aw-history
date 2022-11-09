import { BlockRangeScan } from './block-range-scan';
import { BlockRangeScanRepository, ScanRequest } from './block-range-scan.repository';
import { DuplicateBlockRangeScanError } from './block-range-scanner.errors';

/**
 * @class
 */
export class BlockRangeScanner {
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

  public async updateScanProgress(
    scanKey: string,
    blockNumber: bigint
  ): Promise<void> {
    await this.blockRangeScanRepository.updateScannedBlockNumber(scanKey, blockNumber);
  }
}
