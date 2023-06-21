import { ContractEncodedAbi } from '../contract-encoded-abi';
import { parseToBigInt } from '@alien-worlds/api-core';
import { ContractEncodedAbiMongoModel, ContractEncodedAbiJson } from '../abis.types';
import { MongoDB } from '@alien-worlds/storage-mongodb';

// Mock dependencies
jest.mock('@alien-worlds/api-core');
jest.mock('@alien-worlds/storage-mongodb');

const mockParseToBigInt = parseToBigInt as jest.MockedFunction<typeof parseToBigInt>;
const mockMongoDBLong = MongoDB.Long as jest.MockedClass<typeof MongoDB.Long>;

describe('ContractEncodedAbi', () => {
  const blockNumber = BigInt(123);
  const contract = '0x123';
  const hex = '0xabcdef';

  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();
  });

  describe('fromDocument', () => {
    it('should create a ContractEncodedAbi instance from a document', () => {
      const document: ContractEncodedAbiMongoModel = {
        block_number: mockMongoDBLong.fromBigInt(blockNumber),
        contract,
        hex,
      };

      const result = ContractEncodedAbi.fromDocument(document);

      expect(result.blockNumber).toBe(blockNumber);
      expect(result.contract).toBe(contract);
      expect(result.hex).toBe(hex);
    });

    // Add more test cases for different scenarios
  });

  describe('create', () => {
    it('should create a ContractEncodedAbi instance with the specified values', () => {
      mockParseToBigInt.mockReturnValueOnce(blockNumber);

      const result = ContractEncodedAbi.create(blockNumber, contract, hex);

      expect(mockParseToBigInt).toHaveBeenCalledTimes(1);
      expect(mockParseToBigInt).toHaveBeenCalledWith(blockNumber);
      expect(result.blockNumber).toBe(blockNumber);
      expect(result.contract).toBe(contract);
      expect(result.hex).toBe(hex);
    });

    // Add more test cases for different scenarios
  });

  describe('constructor', () => {
    it('should initialize the ContractEncodedAbi instance with the provided values', () => {
      const result = new ContractEncodedAbi(blockNumber, contract, hex);

      expect(result.blockNumber).toBe(blockNumber);
      expect(result.contract).toBe(contract);
      expect(result.hex).toBe(hex);
    });

    // Add more test cases for different scenarios
  });

  describe('toDocument', () => {
    it('should convert the ContractEncodedAbi instance to a document', () => {
      const instance = new ContractEncodedAbi(blockNumber, contract, hex);
      const expectedDocument: ContractEncodedAbiMongoModel = {
        block_number: mockMongoDBLong.fromBigInt(blockNumber),
        contract,
        hex,
      };

      const result = instance.toDocument();

      expect(mockMongoDBLong.fromBigInt).toHaveBeenCalledTimes(1);
      expect(mockMongoDBLong.fromBigInt).toHaveBeenCalledWith(blockNumber);
      expect(result).toEqual(expectedDocument);
    });

    // Add more test cases for different scenarios
  });

  describe('toJson', () => {
    it('should convert the ContractEncodedAbi instance to JSON', () => {
      const instance = new ContractEncodedAbi(blockNumber, contract, hex);
      const expectedJson: ContractEncodedAbiJson = {
        blockNumber,
        contract,
        hex,
      };

      const result = instance.toJson();

      expect(result).toEqual(expectedJson);
    });

    // Add more test cases for different scenarios
  });
});
