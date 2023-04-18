import { log, MongoConfig, MongoSource, parseToBigInt } from '@alien-worlds/api-core';
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

  public async getState(): Promise<BlockStateData> {
    const state = await this.source.getState();

    if (state) {
      const { last_modified_timestamp, actions, tables, block_number } = state;
      return {
        lastModifiedTimestamp: last_modified_timestamp || new Date(),
        actions: actions || [],
        tables: tables || [],
        blockNumber: parseToBigInt(block_number) || 0n,
      };
    }

    return {
      lastModifiedTimestamp: new Date(),
      actions: [],
      tables: [],
      blockNumber: 0n,
    };
  }

  /**
   * Updates block number.
   * (Only if given value is higher than the one currently stored in the database)
   *
   * @param {bigint} value
   */
  public async newState(block_number: bigint): Promise<void> {
    await this.source.updateBlockNumber(block_number);
  }

  /**
   * Updates block number.
   * (Only if given value is higher than the one currently stored in the database)
   *
   * @param {bigint} value
   */
  public async updateBlockNumber(value: bigint): Promise<void> {
    return this.source.updateBlockNumber(value);
  }

  /**
   * Returns current block number or -1
   * @returns
   */
  public async getBlockNumber(): Promise<bigint> {
    const currentBlockNumber = await this.source.getBlockNumber();
    return currentBlockNumber;
  }
}
