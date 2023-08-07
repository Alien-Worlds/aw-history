/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import { parseToBigInt, removeUndefinedProperties } from '@alien-worlds/aw-core';
import { serialize } from 'v8';

export class BlockRangeScanParent {
  /**
   * @constructor
   * @private
   * @param {bigint} start
   * @param {bigint} end
   * @param {string} scanKey
   */
  constructor(
    public readonly start: bigint,
    public readonly end: bigint,
    public readonly scanKey: string,
    public readonly treeDepth: number
  ) {}

  public static create(start: bigint, end: bigint, scanKey: string, treeDepth: number) {
    return new BlockRangeScanParent(start, end, scanKey, treeDepth);
  }

  public toJson() {
    const { start, end, scanKey, treeDepth } = this;

    return { start, end, scanKey, treeDepth };
  }
}

/**
 * @class
 */
export class BlockRangeScan {
  constructor(
    public readonly hash: string,
    public readonly start: bigint,
    public readonly end: bigint,
    public readonly scanKey: string,
    public readonly treeDepth: number,
    public readonly parent?: BlockRangeScanParent,
    public isLeafNode?: boolean,
    public readonly processedBlock?: bigint,
    public readonly timestamp?: Date,
    public readonly startTimestamp?: Date,
    public readonly endTimestamp?: Date
  ) {}

  /**
   * Create instance of the BlockRangeScanNode
   *
   * @static
   * @param {bigint | number | string} startBlock
   * @param {bigint | number | string} endBlock
   * @param {string} scanKey
   * @param {number} treeDepth
   * @param {BlockRangeScanParent=} parent
   * @param {boolean} isLeafNode
   * @param {bigint | number | string} processedBlock
   * @param {Date} timestamp
   * @returns {BlockRangeScan}
   */
  public static create(
    startBlock: bigint | number | string,
    endBlock: bigint | number | string,
    scanKey: string,
    treeDepth: number,
    parent?: BlockRangeScanParent,
    isLeafNode?: boolean,
    processedBlock?: bigint | number | string,
    timestamp?: Date,
    startTimestamp?: Date,
    endTimestamp?: Date
  ): BlockRangeScan {
    let currentRangeAsBigInt: bigint;

    if (
      typeof processedBlock === 'bigint' ||
      typeof processedBlock === 'number' ||
      typeof processedBlock === 'string'
    ) {
      currentRangeAsBigInt = parseToBigInt(processedBlock);
    }
    let started = startTimestamp;

    if (treeDepth === 0 && !startTimestamp) {
      started = new Date();
    }

    const buffer = serialize({
      startBlock,
      endBlock,
      scanKey,
    });
    const hash = crypto.createHash('sha1').update(buffer).digest('hex');

    return new BlockRangeScan(
      hash,
      parseToBigInt(startBlock),
      parseToBigInt(endBlock),
      scanKey,
      treeDepth,
      parent,
      isLeafNode,
      currentRangeAsBigInt,
      timestamp,
      started,
      endTimestamp
    );
  }

  public static createChildRanges(
    blockRange: BlockRangeScan,
    maxChunkSize: number
  ): BlockRangeScan[] {
    const max = BigInt(maxChunkSize);
    const { start: parentStart, end: parentEnd, scanKey, treeDepth } = blockRange;

    const rangesToPersist: BlockRangeScan[] = [];
    let start = parentStart;

    while (start < parentEnd) {
      const x = start + max;
      const end = x < parentEnd ? x : parentEnd;
      const range = BlockRangeScan.create(
        start,
        end,
        scanKey,
        treeDepth + 1,
        BlockRangeScanParent.create(parentStart, parentEnd, scanKey, treeDepth)
      );

      if (end - start > max) {
        const childRanges = BlockRangeScan.createChildRanges(range, maxChunkSize);
        childRanges.forEach(range => rangesToPersist.push(range));
      } else {
        range.setAsLeafNode();
      }

      rangesToPersist.push(range);
      start += max;
    }

    return rangesToPersist;
  }

  public setAsLeafNode() {
    this.isLeafNode = true;
  }

  public toJson(): BlockRangeScan {
    const {
      start,
      end,
      scanKey,
      isLeafNode,
      treeDepth,
      timestamp,
      processedBlock,
      startTimestamp,
      endTimestamp,
      hash,
    } = this;

    const json = {
      start,
      end,
      scanKey,
      isLeafNode,
      treeDepth,
      timestamp,
      processedBlock,
      startTimestamp,
      endTimestamp,
      parent: null,
      hash,
    };

    if (this.parent) {
      json.parent = this.parent.toJson();
    }

    return removeUndefinedProperties(json);
  }
}
