import {
  Failure,
  log,
  MongoConfig,
  MongoSource,
  parseToBigInt,
  Result,
} from '@alien-worlds/api-core';
import { BlockStateSource } from './block-state.source';
import { BlockStateData } from './block-state.types';

export class BlockState {
  public static async create(mongo: MongoSource | MongoConfig) {
    log(` *  Block State ... [starting]`);

    let state: BlockState;

    if (mongo instanceof MongoSource) {
      state = new BlockState(mongo);
    } else {
      const mongoSource = await MongoSource.create(mongo);
      state = new BlockState(mongoSource);
    }

    log(` *  Block State ... [ready]`);
    return state;
  }

  private source: BlockStateSource;

  private constructor(mongo: MongoSource) {
    this.source = new BlockStateSource(mongo);
  }

  public async getState(): Promise<Result<BlockStateData>> {
    try {
      const state = await this.source.getState();
      let data: BlockStateData;
      if (state) {
        const { last_modified_timestamp, actions, tables, block_number } = state;
        data = {
          lastModifiedTimestamp: last_modified_timestamp || new Date(),
          actions: actions || [],
          tables: tables || [],
          blockNumber: parseToBigInt(block_number) || 0n,
        };
      }

      data = {
        lastModifiedTimestamp: new Date(),
        actions: [],
        tables: [],
        blockNumber: 0n,
      };
      return Result.withContent(data);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Updates block number.
   * (Only if given value is higher than the one currently stored in the database)
   *
   * @param {bigint} value
   */
  public async newState(blockNumber: bigint): Promise<Result> {
    try {
      await this.source.updateBlockNumber(blockNumber);
      return Result.withoutContent();
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Updates block number.
   * (Only if given value is higher than the one currently stored in the database)
   *
   * @param {bigint} value
   */
  public async updateBlockNumber(value: bigint): Promise<Result<boolean>> {
    try {
      const isUpdated = await this.source.updateBlockNumber(value);

      return Result.withContent(isUpdated);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Returns current block number or -1
   * @returns
   */
  public async getBlockNumber(): Promise<Result<bigint>> {
    try {
      const currentBlockNumber = await this.source.getBlockNumber();
      return Result.withContent(currentBlockNumber);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }
}
