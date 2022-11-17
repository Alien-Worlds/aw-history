/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Long } from 'mongodb';
import { BlockRangeScan, BlockRangeScanParent } from '../block-range-scan';

const document = {
  _id: {
    start: Long.fromBigInt(1n),
    end: Long.fromBigInt(2n),
    scan_key: 'test',
    tree_depth: 0,
  },
  processed_block: Long.fromBigInt(1n),
  timestamp: new Date('2022-06-24T19:01:30.911Z'),
  is_leaf_node: false,
  parent_id: {
    start: Long.fromBigInt(0n),
    end: Long.fromBigInt(10n),
    scan_key: 'test',
    tree_depth: 0,
  },
};

describe('Block Range scan entity Unit tests', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-06-24T19:01:30.911Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('"create" should create an entity based on data', async () => {
    const parent = BlockRangeScanParent.create(0n, 10n, 'test', 0);
    const entity = BlockRangeScan.create(
      1n,
      2n,
      'test',
      0,
      parent,
      false,
      0n,
      new Date('2022-06-24T19:01:30.911Z')
    );

    expect(entity.processedBlock).toEqual(0n);
    expect(entity.start).toEqual(1n);
    expect(entity.end).toEqual(2n);
    expect(entity.isLeafNode).toEqual(false);
    expect(entity.timestamp.toISOString()).toEqual('2022-06-24T19:01:30.911Z');
    expect(entity.parent.start).toEqual(0n);
    expect(entity.parent.end).toEqual(10n);
    expect(entity.parent.scanKey).toEqual('test');
    expect(entity.scanKey).toEqual('test');
    expect(entity.treeDepth).toEqual(0);
  });

  it('"fromDocument" should create an entity based on source document', async () => {
    const entity = BlockRangeScan.fromDocument(document);

    expect(entity.processedBlock).toEqual(1n);
    expect(entity.start).toEqual(1n);
    expect(entity.end).toEqual(2n);
    expect(entity.isLeafNode).toEqual(false);
    expect(entity.timestamp.toISOString()).toEqual('2022-06-24T19:01:30.911Z');
    expect(entity.parent.start).toEqual(0n);
    expect(entity.parent.end).toEqual(10n);
    expect(entity.parent.scanKey).toEqual('test');
    expect(entity.scanKey).toEqual('test');
    expect(entity.treeDepth).toEqual(0);
  });

  it('"createChildRanges" should create an entity based on source document', async () => {
    const ranges = BlockRangeScan.createChildRanges(
      BlockRangeScan.create(0n, 10n, 'test', 0),
      4
    );
    const jsons = ranges.map(range => range.toJson()).sort((a, b) => a.start > b.start ? 1 : -1);

    expect(jsons).toEqual([
      {
       end: 4n,
       isLeafNode: true,
       parent:  {
         end: 10n,
         scanKey: "test",
         start: 0n,
         treeDepth: 0,
       },
       scanKey: "test",
       start: 0n,
       treeDepth: 1,
     },
      {
       end: 8n,
       isLeafNode: true,
       parent:  {
         end: 10n,
         scanKey: "test",
         start: 0n,
         treeDepth: 0,
       },
       scanKey: "test",
       start: 4n,
       treeDepth: 1,
     },
      {
       end: 10n,
       isLeafNode: true,
       parent:  {
         end: 10n,
         scanKey: "test",
         start: 0n,
         treeDepth: 0,
       },
       scanKey: "test",
       start: 8n,
       treeDepth: 1,
     },
   ]);
  });

  it('"setAsLeafNode" should set isLeafNode prop to true', async () => {
    const entity = BlockRangeScan.fromDocument(document);

    expect(entity.isLeafNode).toEqual(false);
    entity.setAsLeafNode();
    expect(entity.isLeafNode).toEqual(true);
  });

  it('"toDocument" should create source document based on entity', async () => {
    const entity = BlockRangeScan.fromDocument(document);
    expect(entity.toDocument()).toEqual(document);
  });

  it('"toJson" should create json object based on entity', async () => {
    const entity = BlockRangeScan.fromDocument(document);
    expect(entity.toJson()).toEqual({
      processedBlock: 1n,
      end: 2n,
      isLeafNode: false,
      parent: {
        end: 10n,
        scanKey: 'test',
        start: 0n,
        treeDepth: 0,
      },
      scanKey: 'test',
      start: 1n,
      timestamp: new Date('2022-06-24T19:01:30.911Z'),
      treeDepth: 0,
    });
  });
});
