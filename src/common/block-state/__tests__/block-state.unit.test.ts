import { RepositoryImpl, Failure, Result } from '@alien-worlds/api-core';
import { BlockState } from '../block-state';

jest.mock('@alien-worlds/api-core');
jest.mock('./block-state.types');

describe('BlockState', () => {
  let blockState;
  let dataSourceMock;
  let mapperMock;
  let queryBuildersMock;
  let queryBuilderMock;

  beforeEach(() => {
    dataSourceMock = {
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
    mapperMock = {
      toEntity: jest.fn(),
      fromEntity: jest.fn(),
      getEntityKeyMapping: jest.fn(),
    } as any;
    queryBuildersMock = {
      buildFindQuery: jest.fn(),
      buildCountQuery: jest.fn(),
      buildUpdateQuery: jest.fn(),
      buildRemoveQuery: jest.fn(),
      buildAggregationQuery: jest.fn(),
    } as any;
    queryBuilderMock = {
      with: jest.fn(),
      build: jest.fn(),
    } as any;

    blockState = new BlockState(
      dataSourceMock,
      mapperMock,
      queryBuilderMock,
      queryBuilderMock
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be a valid instance', () => {
    expect(blockState).toBeInstanceOf(BlockState);
    expect(blockState).toBeInstanceOf(RepositoryImpl);
  });

  describe('getState()', () => {
    it('should return block state data', async () => {
      const mockData = {
        content: [
          {
            lastModifiedTimestamp: new Date(),
            actions: [],
            tables: [],
            blockNumber: 0n,
          },
        ],
      };
      blockState.find = jest.fn().mockResolvedValue(mockData);

      const result = await blockState.getState();

      expect(blockState.find).toHaveBeenCalled();
      expect(result).toEqual(Result.withContent(mockData.content[0]));
    });

    it('should handle error properly', async () => {
      const mockError = new Error('Database error');
      blockState.find = jest.fn().mockRejectedValue(mockError);

      const result = await blockState.getState();

      expect(blockState.find).toHaveBeenCalled();
      expect(result).toEqual(Result.withFailure(Failure.fromError(mockError)));
    });
  });

  describe('updateBlockNumber()', () => {
    it('should update block number and return true if successful', async () => {
      const mockValue = 10n;
      const mockData = {
        content: {
          modifiedCount: 1,
          upsertedCount: 0,
        },
      };
      blockState.update = jest.fn().mockResolvedValue(mockData);

      const result = await blockState.updateBlockNumber(mockValue);

      expect(blockState.update).toHaveBeenCalledWith(
        queryBuilderMock.with({ blockNumber: mockValue })
      );
      expect(result).toEqual(Result.withContent(true));
    });

    // Write similar tests for getBlockNumber() here...
  });
});
