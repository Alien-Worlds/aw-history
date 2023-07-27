/* eslint-disable @typescript-eslint/no-unsafe-return */

import { DataSource } from '@alien-worlds/aw-core';

export abstract class BlockRangeScanSource<T = unknown> extends DataSource {
  public abstract startNextScan(scanKey: string): Promise<T>;
  public abstract countScanNodes(
    scanKey: string,
    startBlock: bigint,
    endBlock: bigint
  ): Promise<number>;
  public abstract removeAll(scanKey: string);
  public abstract hasScanKey(
    scanKey: string,
    startBlock?: bigint,
    endBlock?: bigint
  ): Promise<boolean>;
  public abstract hasUnscannedNodes(
    scanKey: string,
    startBlock?: bigint,
    endBlock?: bigint
  ): Promise<boolean>;
  public abstract findRangeForBlockNumber(blockNumber: bigint, scanKey: string);
  public abstract findCompletedParentNode(document: T);
  public abstract updateProcessedBlockNumber(
    scanKey: string,
    blockNumber: bigint
  ): Promise<void>;
}
