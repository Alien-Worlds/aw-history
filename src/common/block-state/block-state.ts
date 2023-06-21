import {
  DataSource,
  Failure,
  QueryBuilder,
  QueryBuilders,
  RepositoryImpl,
  Result,
} from '@alien-worlds/api-core';
import { BlockStateModel, BlockStateMongoModel } from './block-state.types';
import { BlockStateMongoMapper } from './block-state.mongo.mapper';

/**
 * A class representing a block state.
 * @extends RepositoryImpl<BlockStateModel, BlockStateMongoModel>
 */
export class BlockState extends RepositoryImpl<BlockStateModel, BlockStateMongoModel> {
  /**
   * Creates an instance of the BlockState class.
   *
   * @param {DataSource<BlockStateMongoModel>} source - The data source.
   * @param {BlockStateMongoMapper} mapper - The data mapper.
   * @param {QueryBuilders} queryBuilders - The query builders.
   * @param {QueryBuilder} updateBlockNumberQueryBuilder - The query builder to update block number.
   */
  constructor(
    source: DataSource<BlockStateMongoModel>,
    mapper: BlockStateMongoMapper,
    queryBuilders: QueryBuilders,
    private updateBlockNumberQueryBuilder: QueryBuilder
  ) {
    super(source, mapper, queryBuilders);
  }

  /**
   * Fetches the current state of the data source.
   *
   * @returns {Promise<Result<BlockStateModel>>} - The result of the operation.
   */
  public async getState(): Promise<Result<BlockStateModel>> {
    try {
      const { content: states } = await this.find();

      if (states) {
        const state = states[0];
        const { lastModifiedTimestamp, actions, tables, blockNumber } = state;

        return Result.withContent({
          lastModifiedTimestamp: lastModifiedTimestamp || new Date(),
          actions: actions || [],
          tables: tables || [],
          blockNumber: blockNumber || 0n,
        });
      }

      return Result.withContent({
        lastModifiedTimestamp: new Date(),
        actions: [],
        tables: [],
        blockNumber: 0n,
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
