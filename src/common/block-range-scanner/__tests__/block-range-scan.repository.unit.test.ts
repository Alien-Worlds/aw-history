/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Failure, MongoSource } from '@alien-worlds/api-core';
import { BlockRangeScan } from '../block-range-scan';
import { BlockRangeScanMongoSource } from '../block-range-scan.mongo.source';
import { BlockRangeScanRepository } from '../block-range-scan.repository';

const blockRangeScanConfig = {
  maxChunkSize: 0,
  scanKey: 'test',
};

const db = {
  databaseName: 'TestDB',
  collection: jest.fn(() => ({
    find: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    insertOne: jest.fn(),
    insertMany: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
    findOneAndUpdate: jest.fn(),
  })) as any,
};

const dto = {
  _id: { start: 0n, end: 10n, scan_key: 'test' },
  tree_depth: 0,
  processed_block: 0n,
  time_stamp: new Date('2022-07-01T09:59:29.035Z'),
  is_leaf_node: true,
  parent_id: { start: 0n, end: 1n, scan_key: 'test' },
};

const mongoSource = new MongoSource(db as any);
const blockRangeScanMongoSource = new BlockRangeScanMongoSource(mongoSource);

describe('Block Range scan repository Unit tests', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-06-24T19:01:30.911Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('"startNextScan" should return a result with BlockRangeScan object', async () => {
    const repo = new BlockRangeScanRepository(
      blockRangeScanMongoSource,
      blockRangeScanConfig
    );
    const startNextScanMock = jest
      .spyOn(blockRangeScanMongoSource, 'startNextScan')
      .mockImplementation(() => dto as any);

    const result = await repo.startNextScan('test');

    expect(result).toBeInstanceOf(BlockRangeScan);

    startNextScanMock.mockClear();
  });

  it('"startNextScan" should return null when no block range node was found for the given key', async () => {
    const repo = new BlockRangeScanRepository(
      blockRangeScanMongoSource,
      blockRangeScanConfig
    );
    const startNextScanMock = jest
      .spyOn(blockRangeScanMongoSource, 'startNextScan')
      .mockImplementation(() => {
        throw new Error();
      });
    const result = await repo.startNextScan('test');

    expect(result).toBeNull();

    startNextScanMock.mockClear();
  });

  it('"createScanNodes" should insert multiple scan nodes to the source', async () => {
    const repo = new BlockRangeScanRepository(
      blockRangeScanMongoSource,
      blockRangeScanConfig
    );
    const createChildRangesMock = jest.fn().mockImplementation(() => []);

    BlockRangeScan.createChildRanges = createChildRangesMock;
    const insertManyMock = jest
      .spyOn(blockRangeScanMongoSource, 'insertMany')
      .mockImplementation(async () => []);

    const result = await repo.createScanNodes('test', 0n, 1n);

    expect(createChildRangesMock).toBeCalled();
    expect(insertManyMock).toBeCalled();
    expect(result).toBeTruthy();

    insertManyMock.mockClear();
    createChildRangesMock.mockClear();
  });

  it('"createScanNodes" should return false on any error', async () => {
    const repo = new BlockRangeScanRepository(
      blockRangeScanMongoSource,
      blockRangeScanConfig
    );
    const createMock = jest.fn().mockImplementation(() => {
      throw new Error();
    });
    BlockRangeScan.create = createMock;

    const result = await repo.createScanNodes('test', 0n, 1n);

    expect(createMock).toBeCalled();
    expect(result).toBeFalsy();

    createMock.mockClear();
  });

  it('"countScanNodes" should result with number of nodes', async () => {
    const repo = new BlockRangeScanRepository(
      blockRangeScanMongoSource,
      blockRangeScanConfig
    );
    const countScanNodesMock = jest
      .spyOn(blockRangeScanMongoSource, 'countScanNodes')
      .mockImplementation(async () => 6);

    const result = await repo.countScanNodes('test', 0n, 1n);

    expect(countScanNodesMock).toBeCalled();
    expect(result).toEqual(6);

    countScanNodesMock.mockClear();
  });

  it('"removeAll" should result with number of nodes', async () => {
    const repo = new BlockRangeScanRepository(
      blockRangeScanMongoSource,
      blockRangeScanConfig
    );
    const removeAllMock = jest
      .spyOn(blockRangeScanMongoSource, 'removeAll')
      .mockImplementation();

    const result = await repo.removeAll('test');

    expect(removeAllMock).toBeCalled();

    removeAllMock.mockClear();
  });

  it('"hasScanKey" should result with boolean value', async () => {
    const repo = new BlockRangeScanRepository(
      blockRangeScanMongoSource,
      blockRangeScanConfig
    );
    const hasScanKeyMock = jest
      .spyOn(blockRangeScanMongoSource, 'hasScanKey')
      .mockImplementation(async () => true);

    const result = await repo.hasScanKey('test');

    expect(hasScanKeyMock).toBeCalled();
    expect(result).toEqual(true);

    hasScanKeyMock.mockClear();
  });

  it('"hasUnscannedNodes" should result with boolean value', async () => {
    const repo = new BlockRangeScanRepository(
      blockRangeScanMongoSource,
      blockRangeScanConfig
    );
    const hasUnscannedNodesMock = jest
      .spyOn(blockRangeScanMongoSource, 'hasUnscannedNodes')
      .mockImplementation(async () => true);

    const result = await repo.hasUnscannedNodes('test');

    expect(hasUnscannedNodesMock).toBeCalled();
    expect(result).toEqual(true);

    hasUnscannedNodesMock.mockClear();
  });

  it('"updateScannedBlockNumber" should call source.updateProcessedBlockNumber and result with no content', async () => {
    const repo = new BlockRangeScanRepository(
      blockRangeScanMongoSource,
      blockRangeScanConfig
    );
    const updateScannedBlockNumberMock = jest
      .spyOn(blockRangeScanMongoSource, 'updateProcessedBlockNumber')
      .mockImplementation();

    const result = await repo.updateScannedBlockNumber('test', 0n);

    expect(updateScannedBlockNumberMock).toBeCalled();

    updateScannedBlockNumberMock.mockClear();
  });
});
