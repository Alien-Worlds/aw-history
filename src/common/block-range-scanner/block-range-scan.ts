/* eslint-disable @typescript-eslint/no-explicit-any */

import { parseToBigInt, removeUndefinedProperties } from '@alien-worlds/api-core';
import { Long } from 'mongodb';
import {
  BlockRangeScanDocument,
  BlockRangeScanIdDocument,
} from './block-range-scanner.dtos';

export class BlockRangeScanParent {
  /**
   * @constructor
   * @private
   * @param {bigint} start
   * @param {bigint} end
   * @param {string} scanKey
   */
  private constructor(
    public readonly start: bigint,
    public readonly end: bigint,
    public readonly scanKey: string,
    public readonly treeDepth: number
  ) {}

  public static create(start: bigint, end: bigint, scanKey: string, treeDepth: number) {
    return new BlockRangeScanParent(start, end, scanKey, treeDepth);
  }

  public static fromDocument(document: BlockRangeScanIdDocument) {
    const { start, end, scan_key, tree_depth } = document;

    return new BlockRangeScanParent(
      parseToBigInt(start),
      parseToBigInt(end),
      scan_key,
      tree_depth
    );
  }

  public toDocument() {
    const { start, end, scanKey, treeDepth } = this;
    const doc = {
      start: Long.fromString(start.toString()),
      end: Long.fromString(end.toString()),
      scan_key: scanKey,
      tree_depth: treeDepth,
    };

    return doc;
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
  protected constructor(
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

    return new BlockRangeScan(
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

  public static fromDocument(document: BlockRangeScanDocument) {
    const {
      _id: { start, end, scan_key, tree_depth },
      processed_block,
      timestamp,
      start_timestamp,
      end_timestamp,
      parent_id,
      is_leaf_node,
    } = document;

    const parent = parent_id ? BlockRangeScanParent.fromDocument(parent_id) : null;

    let processedBlock: bigint;

    if (processed_block) {
      processedBlock = parseToBigInt(processed_block);
    }

    return new BlockRangeScan(
      parseToBigInt(start),
      parseToBigInt(end),
      scan_key,
      tree_depth,
      parent,
      is_leaf_node,
      processedBlock,
      timestamp,
      start_timestamp,
      end_timestamp
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

  public toDocument() {
    const { start, scanKey, end, treeDepth } = this;
    const doc: BlockRangeScanDocument = {
      _id: {
        start: Long.fromString(start.toString()),
        end: Long.fromString(end.toString()),
        scan_key: scanKey,
        tree_depth: treeDepth,
      },
    };

    if (typeof this.processedBlock == 'bigint') {
      doc.processed_block = Long.fromString(this.processedBlock.toString());
    }

    if (typeof this.isLeafNode == 'boolean') {
      doc.is_leaf_node = this.isLeafNode;
    }

    if (this.parent) {
      doc.parent_id = this.parent.toDocument();
    }

    if (this.timestamp) {
      doc.timestamp = this.timestamp;
    }

    if (this.startTimestamp) {
      doc.start_timestamp = this.startTimestamp;
    }

    if (this.endTimestamp) {
      doc.end_timestamp = this.endTimestamp;
    }

    return doc;
  }

  public toJson() {
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
    };

    if (this.parent) {
      json.parent = this.parent.toJson();
    }

    return removeUndefinedProperties(json);
  }
}
