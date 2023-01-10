import { log, MongoSource, parseToBigInt } from '@alien-worlds/api-core';
import { BlockStateSource } from './block-state.source';
import { BlockStateData } from './block-state.types';

export class BlockState {
  private source: BlockStateSource;

  constructor(mongo: MongoSource) {
    this.source = new BlockStateSource(mongo);
  }

  public async getState(): Promise<BlockStateData> {
    const state = await this.source.getState();

    return {
      lastModifiedTimestamp: state?.last_modified_timestamp || new Date(),
      actions: state?.actions || [],
      tables: state?.tables || [],
      blockNumber: parseToBigInt(state?.block_number) || 0n,
    };
  }

  /**
   * Updates block number.
   * (Only if given value is higher than the one currently stored in the database)
   *
   * @param {bigint} value
   */
  public async newState(
    value: bigint,
    actions: string[],
    tables: string[]
  ): Promise<void> {
    return this.source.newState(value, actions, tables);
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
    log(
      `Current state block number: ${
        currentBlockNumber ? currentBlockNumber.toString() : currentBlockNumber
      }`
    );
    return currentBlockNumber;
  }

  public async getActions(): Promise<string[]> {
    return this.source.getActions();
  }

  public async includesAction(label: string): Promise<boolean> {
    return this.source.includesAction(label);
  }

  public async setActions(labels: string[]): Promise<void> {
    return this.source.setActions(labels);
  }

  public async removeActions(labels: string[]): Promise<void> {
    return this.source.removeActions(labels);
  }

  public async setTables(labels: string[]): Promise<void> {
    return this.source.setTables(labels);
  }

  public async removeTables(labels: string[]): Promise<void> {
    return this.source.removeTables(labels);
  }

  public async getTables(): Promise<string[]> {
    return this.source.getTables();
  }

  public async includesTable(label: string): Promise<boolean> {
    return this.source.includesTable(label);
  }
}
