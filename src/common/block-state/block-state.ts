import {
  DataSource,
  Failure,
  Mapper,
  QueryBuilder,
  QueryBuilders,
  RepositoryImpl,
  Result,
} from '@alien-worlds/api-core';
import { BlockStateData, BlockStateDocument } from './block-state.types';

/**
 * A class representing a block state.
 * @extends RepositoryImpl<BlockStateData, BlockStateDocument>
 */
export class BlockState extends RepositoryImpl<BlockStateData, BlockStateDocument> {
  /**
   * Creates an instance of the BlockState class.
   *
   * @param {DataSource<BlockStateDocument>} source - The data source.
   * @param {Mapper<BlockStateData, BlockStateDocument>} mapper - The data mapper.
   * @param {QueryBuilders} queryBuilders - The query builders.
   * @param {QueryBuilder} updateBlockNumberQueryBuilder - The query builder to update block number.
   */
  constructor(
    source: DataSource<BlockStateDocument>,
    mapper: Mapper<BlockStateData, BlockStateDocument>,
    queryBuilders: QueryBuilders,
    private updateBlockNumberQueryBuilder: QueryBuilder
  ) {
    super(source, mapper, queryBuilders);
  }

  /**
   * Fetches the current state of the data source.
   *
   * @returns {Promise<Result<BlockStateData>>} - The result of the operation.
   */
  public async getState(): Promise<Result<BlockStateData>> {
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
