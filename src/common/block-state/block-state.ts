import {
  DataSource,
  Failure,
  Mapper,
  QueryBuilder,
  QueryBuilders,
  RepositoryImpl,
  Result,
} from '@alien-worlds/aw-core';
import { BlockStateEntity, BlockStateModel } from './block-state.types';

/**
 * A class representing a block state.
 */
export class BlockState extends RepositoryImpl<BlockStateEntity, BlockStateModel> {
  /**
   * Creates an instance of the BlockState class.
   *
   * @param {DataSource<BlockStateMongoModel>} source - The data source.
   * @param {BlockStateMongoMapper} mapper - The data mapper.
   * @param {QueryBuilders} queryBuilders - The query builders.
   * @param {QueryBuilder} updateBlockNumberQueryBuilder - The query builder to update block number.
   */
  constructor(
    source: DataSource<BlockStateModel>,
    mapper: Mapper<BlockStateEntity, BlockStateModel>,
    queryBuilders: QueryBuilders,
    private updateBlockNumberQueryBuilder: QueryBuilder
  ) {
    super(source, mapper, queryBuilders);
  }

  /**
   * Initialize state if not already set.
   */
  public async initState(): Promise<Result<void>> {
    try {
      const { content: states } = await this.find();

      if (states.length === 0) {
        await this.add([
          {
            lastModifiedTimestamp: new Date(),
            actions: [],
            tables: [],
            blockNumber: 0n,
          },
        ]);
      }
      return Result.withoutContent();
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Fetches the current state of the data source.
   *
   * @returns {Promise<Result<BlockStateEntity>>} - The result of the operation.
   */
  public async getState(): Promise<Result<BlockStateEntity>> {
    try {
      const { content: states } = await this.find();

      const state = states[0];
      const { lastModifiedTimestamp, actions, tables, blockNumber } = state;

      return Result.withContent({
        lastModifiedTimestamp,
        actions,
        tables,
        blockNumber,
      });
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Updates the block number in the current state.
   *
   * @param {bigint} value - The new block number.
   * @returns {Promise<Result<boolean>>} - The result of the operation.
   */
  public async updateBlockNumber(value: bigint): Promise<Result<boolean>> {
    this.updateBlockNumberQueryBuilder.with({ blockNumber: value });
    const { content, failure } = await this.update(this.updateBlockNumberQueryBuilder);

    if (failure) {
      return Result.withFailure(failure);
    }

    return Result.withContent(content.modifiedCount + content.upsertedCount > 0);
  }

  /**
   * Fetches the current block number from the current state.
   *
   * @returns {Promise<Result<bigint>>} - The result of the operation.
   */
  public async getBlockNumber(): Promise<Result<bigint>> {
    const { content: states, failure } = await this.find();

    if (failure) {
      return Result.withFailure(failure);
    }

    if (states.length > 0) {
      const state = states[0];

      return Result.withContent(state.blockNumber);
    }

    return Result.withContent(-1n);
  }
}
