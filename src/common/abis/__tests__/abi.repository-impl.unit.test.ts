import { AbisRepositoryImpl } from '../abis.repository-impl';
import { Result, CountParams, ContractEncodedAbi } from '@alien-worlds/api-core';
import { AbisCache } from '../abis.cache';

jest.mock('../abis.cache');

const mockDataSource = {
  find: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  update: jest.fn(),
  insert: jest.fn(),
  remove: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
} as any;

const mockMapper = {
  toEntity: jest.fn(),
  fromEntity: jest.fn(),
  getEntityKeyMapping: jest.fn(),
} as any;

const mockQueryBuilders = {
  buildFindQuery: jest.fn(),
  buildCountQuery: jest.fn(),
  buildUpdateQuery: jest.fn(),
  buildRemoveQuery: jest.fn(),
  buildAggregationQuery: jest.fn(),
} as any;

describe('AbisRepositoryImpl', () => {
  let repository: AbisRepositoryImpl;
  let mockCache: jest.Mocked<AbisCache>;

  beforeEach(() => {
    mockCache = new AbisCache() as jest.Mocked<AbisCache>;
    repository = new AbisRepositoryImpl(mockDataSource, mockMapper, mockQueryBuilders);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAbis', () => {
    it('should return abis from cache if present', async () => {
      const mockAbis: ContractEncodedAbi[] = [
        /* mock data here */
      ];
      mockCache.getAbis.mockReturnValue(mockAbis);

      const result = await repository.getAbis({ contracts: ['contract1'] });

      expect(result).toEqual(Result.withContent(mockAbis));
      expect(mockCache.getAbis).toHaveBeenCalledWith({ contracts: ['contract1'] });
    });
  });

  describe('getAbi', () => {
    it('should return abi from cache if present', async () => {
      const mockAbi: ContractEncodedAbi = {} as any;
      const blockNumber = BigInt(10);
      const contract = 'contract1';

      mockCache.getAbi.mockReturnValue(mockAbi);

      const result = await repository.getAbi(blockNumber, contract);

      expect(result).toEqual(Result.withContent(mockAbi));
      expect(mockCache.getAbi).toHaveBeenCalledWith(blockNumber, contract);
    });
  });

  describe('insertAbis', () => {
    it('should insert abis into the cache and the database', async () => {
      const mockAbis: ContractEncodedAbi[] = [
        /* mock data here */
      ];
      const addSpy = jest.spyOn(repository, 'add');
      addSpy.mockResolvedValue(Result.withContent(mockAbis));

      const result = await repository.insertAbis(mockAbis);

      expect(result).toEqual(Result.withContent(mockAbis.length > 0));
      expect(mockCache.insertAbis).toHaveBeenCalledWith(mockAbis);
      expect(addSpy).toHaveBeenCalledWith(mockAbis);
    });
  });

  describe('countAbis', () => {
    it('should count abis based on the startBlock and endBlock', async () => {
      const countSpy = jest.spyOn(repository, 'count');
      const mockCount = 5;
      countSpy.mockResolvedValue(Result.withContent(mockCount));

      const startBlock = BigInt(10);
      const endBlock = BigInt(20);

      const result = await repository.countAbis(startBlock, endBlock);

      expect(result).toEqual(Result.withContent(mockCount));
      expect(countSpy).toHaveBeenCalledWith(
        CountParams.create({ where: expect.anything() })
      );
    });
  });
});
