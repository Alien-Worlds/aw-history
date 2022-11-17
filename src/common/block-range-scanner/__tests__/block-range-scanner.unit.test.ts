/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { BlockRangeScanRepository } from "../block-range-scan.repository";
import { BlockRangeScanner } from "../block-range-scanner";

jest.mock('../block-range-scan.repository', () => ({
  BlockRangeScanRepository: jest.fn(() => ({
    hasScanKey: jest.fn(),
    createScanNodes: jest.fn(),
    startNextScan: jest.fn(),
    hasUnscannedNodes: jest.fn(),
    updateScannedBlockNumber: jest.fn(),
  }))
}));

jest.mock('mongodb');

const config = {
  maxChunkSize: 10,
  scanKey: 'test',
};

describe('Block Range Scanner Unit tests', () => {

  it('"createScanNodes" should call hasScanKey and createScanNodes when scan key is available', async () => {
    const repo = new BlockRangeScanRepository({} as any, config);
    const scanner = new BlockRangeScanner(repo);
    await scanner.createScanNodes('test', 0n, 10n)

    expect(repo.hasScanKey).toBeCalled();
    expect(repo.createScanNodes).toBeCalled();
  });

  it('"createScanNodes" should call only hasScanKey when scan key is not available', async () => {
    const repo = new BlockRangeScanRepository({} as any, config);
    const scanner = new BlockRangeScanner(repo);

    (repo.hasScanKey as any).mockImplementation(() => true)

    await scanner.createScanNodes('test', 0n, 10n)

    expect(repo.hasScanKey).toBeCalled();
    expect(repo.createScanNodes).not.toBeCalled();
  });

  it('"getNextScanNode" should call startNextScan and return its value', async () => {
    const repo = new BlockRangeScanRepository({} as any, config);
    const scanner = new BlockRangeScanner(repo);
    
    (repo.startNextScan as any).mockImplementation(() => ({ mockedScan: true }))

    const result = await scanner.getNextScanNode('');

    expect(repo.startNextScan).toBeCalled();
    expect(result).toEqual({ mockedScan: true });
  });

  it('"hasUnscannedBlocks" should call startNextScan and return its value', async () => {
    const repo = new BlockRangeScanRepository({} as any, config);
    const scanner = new BlockRangeScanner(repo);
    
    (repo.hasUnscannedNodes as any).mockImplementation(() => false)

    const result = await scanner.hasUnscannedBlocks('');

    expect(repo.hasUnscannedNodes).toBeCalled();
    expect(result).toEqual(false);
  });

  it('"updateScanProgress" should call updateScannedBlockNumber', async () => {
    const repo = new BlockRangeScanRepository({} as any, config);
    const scanner = new BlockRangeScanner(repo);

    await scanner.updateScanProgress('', 1n);

    expect(repo.updateScannedBlockNumber).toBeCalled();
  });
});
