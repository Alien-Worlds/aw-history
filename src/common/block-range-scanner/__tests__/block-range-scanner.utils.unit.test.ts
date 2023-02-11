/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { MongoSource } from "@alien-worlds/api-core";
import { BlockRangeScanner } from "../block-range-scanner";
import { setupBlockRangeScanner } from "../block-range-scanner.utils";

jest.mock('@alien-worlds/api-core/build/storage/data/data-sources/mongo.helpers', () => ({
  connectMongo: jest.fn(() => ({
    collection: () => jest.fn()
  })),
}));

jest.mock('mongodb');

let findMock;
let countMock;
let deleteOneMock;
let deleteManyMock;
let aggregateMock;
let findOneMock;
let updateOneMock;
let updateManyMock;
let bulkWriteMock;
let insertOneMock;
let insertManyMock;

const db = {
  databaseName: 'TestDB',
  collection: jest.fn(() => ({
    find: jest.fn(() => findMock()),
    countDocuments: jest.fn(() => countMock()),
    aggregate: jest.fn(() => aggregateMock()),
    findOne: jest.fn(() => findOneMock()),
    bulkWrite: jest.fn(() => bulkWriteMock()),
    updateOne: jest.fn(() => updateOneMock()),
    updateMany: jest.fn(() => updateManyMock()),
    insertOne: jest.fn(() => insertOneMock()),
    insertMany: jest.fn(() => insertManyMock()),
    deleteOne: jest.fn(() => deleteOneMock()),
    deleteMany: jest.fn(() => deleteManyMock()),
  })) as any,
};

const config = {
  maxChunkSize: 10,
  scanKey: 'test',
};

const mongoConfig = {
  hosts: [''],
  database: '',
};

const mongoSource = new MongoSource(db as any);

describe('Block Range Scan utils Unit tests', () => {

  it('"setupBlockRangeScanner" should return block range scanner instance', async () => {
    let scanner;
    scanner = await setupBlockRangeScanner(mongoSource, config);
    expect(scanner).toBeInstanceOf(BlockRangeScanner);

    scanner = await setupBlockRangeScanner(mongoConfig, config);
    expect(scanner).toBeInstanceOf(BlockRangeScanner);
  });
});
