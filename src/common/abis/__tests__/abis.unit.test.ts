import { Abis } from '../abis';
import { AbisRepositoryImpl } from '../abis.repository-impl';
import { Failure, Result, AbiService } from '@alien-worlds/api-core';
import { AbisServiceNotSetError } from '../abis.errors';
import { AbiNotFoundError } from '@alien-worlds/block-reader';

// Mock dependencies
jest.mock('../abis.repository-impl');
jest.mock('../abis.service');

const mockAbisRepository = {
  cacheAbis: jest.fn(),
  getAbis: jest.fn(),
  getAbi: jest.fn(),
  insertAbis: jest.fn(),
  countAbis: jest.fn(),
} as any;
const mockAbisService = { fetchAbis: jest.fn() } as any;

describe('Abis', () => {
  let abis: Abis;

  beforeEach(() => {
    // Reset mocks and create a new instance of Abis
    jest.resetAllMocks();
    abis = new Abis(new mockAbisRepository(), new mockAbisService());
  });

  describe('getAbis', () => {
    it('should return ABIs from repository when available', async () => {
      const mockAbis = [
        /* Mocked ABIs */
      ];
      mockAbisRepository.prototype.getAbis.mockResolvedValue(
        Result.withContent(mockAbis)
      );

      const result = await abis.getAbis();

      expect(mockAbisRepository.prototype.getAbis).toHaveBeenCalledTimes(1);
      expect(result.isFailure).toBe(false);
      expect(result.content).toEqual(mockAbis);
    });

    it('should fetch ABIs when none are available in the repository and fetch option is enabled', async () => {
      const mockAbis = [
        /* Mocked ABIs */
      ];
      mockAbisRepository.prototype.getAbis.mockResolvedValue(Result.withContent([]));
      abis.fetchAbis = jest.fn().mockResolvedValue(Result.withContent(mockAbis));

      const result = await abis.getAbis({ fetch: true });

      expect(mockAbisRepository.prototype.getAbis).toHaveBeenCalledTimes(1);
      expect(abis.fetchAbis).toHaveBeenCalledTimes(1);
      expect(result.isFailure).toBe(false);
      expect(result.content).toEqual(mockAbis);
    });

    // Add more test cases for different scenarios
  });

  describe('getAbi', () => {
    it('should return ABI from repository when available', async () => {
      const mockAbi = '1234567890';
      mockAbisRepository.prototype.getAbi.mockResolvedValue(Result.withContent(mockAbi));

      const result = await abis.getAbi(123n, '0x123');

      expect(mockAbisRepository.prototype.getAbi).toHaveBeenCalledTimes(1);
      expect(result.isFailure).toBe(false);
      expect(result.content).toEqual(mockAbi);
    });

    it('should fetch ABI when not available in the repository and fetch option is enabled', async () => {
      const mockAbi = '1234567890';
      mockAbisRepository.prototype.getAbi.mockResolvedValue(
        Result.withFailure(Failure.fromError(new AbiNotFoundError()))
      );
      abis.fetchAbis = jest.fn().mockResolvedValue(Result.withContent([mockAbi]));

      const result = await abis.getAbi(123n, '0x123', true);

      expect(mockAbisRepository.prototype.getAbi).toHaveBeenCalledTimes(1);
      expect(abis.fetchAbis).toHaveBeenCalledTimes(1);
      expect(result.isFailure).toBe(false);
      expect(result.content).toEqual(mockAbi);
    });

    // Add more test cases for different scenarios
  });

  describe('storeAbi', () => {
    it('should insert the ABI into the repository', async () => {
      const blockNumber = 123n;
      const contract = '0x123';
      const hex = '0xabcdef';

      mockAbisRepository.prototype.insertAbis.mockResolvedValue(Result.withContent(true));

      const result = await abis.storeAbi(blockNumber, contract, hex);

      expect(mockAbisRepository.prototype.insertAbis).toHaveBeenCalledTimes(1);
      expect(mockAbisRepository.prototype.insertAbis).toHaveBeenCalledWith([
        expect.objectContaining({ blockNumber, contract, hex }),
      ]);
      expect(result.isFailure).toBe(false);
      expect(result.content).toBe(true);
    });

    // Add more test cases for different scenarios
  });

  describe('fetchAbis', () => {
    it('should throw AbisServiceNotSetError when service is not set', async () => {
      abis = new Abis(new mockAbisRepository()); // Create instance without AbisService

      await expect(abis.fetchAbis()).rejects.toThrow(AbisServiceNotSetError);
    });

    it('should fetch ABIs using the service', async () => {
      const mockAbis = [
        /* Mocked ABIs */
      ];
      const mockContracts = ['0x123', '0x456'];
      const mockServiceResponse = Result.withContent(mockAbis);

      abis = new Abis(new mockAbisRepository(), new mockAbisService());
      mockAbisService.prototype.fetchAbis.mockResolvedValue(mockServiceResponse);

      const result = await abis.fetchAbis(mockContracts);

      expect(mockAbisService.prototype.fetchAbis).toHaveBeenCalledTimes(
        mockContracts.length
      );
      expect(mockAbisService.prototype.fetchAbis).toHaveBeenCalledWith(
        expect.any(String)
      );
      expect(result.isFailure).toBe(false);
      expect(result.content).toEqual(mockAbis);
    });

    // Add more test cases for different scenarios
  });

  describe('cacheAbis', () => {
    it('should cache ABIs in the repository', async () => {
      const mockContracts = ['0x123', '0x456'];

      mockAbisRepository.prototype.cacheAbis.mockResolvedValue();

      const result = await abis.cacheAbis(mockContracts);

      expect(mockAbisRepository.prototype.cacheAbis).toHaveBeenCalledTimes(1);
      expect(mockAbisRepository.prototype.cacheAbis).toHaveBeenCalledWith(mockContracts);
      expect(result.isFailure).toBe(false);
      expect(result.content).toBeUndefined();
    });

    // Add more test cases for different scenarios
  });
});
