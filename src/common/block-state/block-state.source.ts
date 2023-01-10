import {
  CollectionMongoSource,
  Long,
  MongoSource,
  parseToBigInt,
} from '@alien-worlds/api-core';
import { BlockStateDocument } from './block-state.types';

export class BlockStateSource extends CollectionMongoSource<BlockStateDocument> {
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'history_tools_state');
  }

  public async getState(): Promise<BlockStateDocument> {
    const state: BlockStateDocument = await this.findOne({ filter: {} });

    return state;
  }

  public async newState(
    blockNumber: bigint,
    actions: string[] = [],
    tables: string[] = []
  ): Promise<void> {
    const result = await this.update(
      {
        block_number: Long.fromBigInt(blockNumber),
        actions,
        tables,
        last_modified_timestamp: new Date(),
      },
      { options: { upsert: true } }
    );
    if (result) {
      await this.update(
        { last_modified_timestamp: new Date() },
        { options: { upsert: true } }
      );
    }
  }

  /**
   * Updates block number.
   * (Only if given value is higher than the one currently stored in the database)
   *
   * @param {bigint} value
   */
  public async updateBlockNumber(value: bigint): Promise<void> {
    const result = await this.update(
      { $max: { block_number: Long.fromBigInt(value) } },
      { options: { upsert: true } }
    );
    if (result) {
      await this.update(
        { last_modified_timestamp: new Date() },
        { options: { upsert: true } }
      );
    }
  }

  public async removeActions(labels: string[]): Promise<void> {
    await this.update(
      { $pull: { actions: { $in: labels } }, last_modified_timestamp: new Date() },
      { options: { upsert: true } }
    );
  }

  public async setActions(labels: string[]): Promise<void> {
    await this.update(
      { actions: labels, last_modified_timestamp: new Date() },
      { options: { upsert: true } }
    );
  }

  public async removeTables(labels: string[]): Promise<void> {
    await this.update(
      { $pull: { tables: { $in: labels } }, last_modified_timestamp: new Date() },
      { options: { upsert: true } }
    );
  }

  public async setTables(labels: string[]): Promise<void> {
    await this.update(
      { tables: labels, last_modified_timestamp: new Date() },
      { options: { upsert: true } }
    );
  }

  public async getBlockNumber(): Promise<bigint> {
    const state: BlockStateDocument = await this.findOne({ filter: {} });

    return parseToBigInt(state?.block_number ? state.block_number : Long.NEG_ONE);
  }

  public async getActions(): Promise<string[]> {
    const state: BlockStateDocument = await this.findOne({ filter: {} });

    return state?.actions || [];
  }

  public async getTables(): Promise<string[]> {
    const state: BlockStateDocument = await this.findOne({ filter: {} });

    return state?.tables || [];
  }

  public async includesAction(label: string): Promise<boolean> {
    const state: BlockStateDocument = await this.findOne({ filter: {} });

    return state?.actions.includes(label) === true;
  }

  public async includesTable(label: string): Promise<boolean> {
    const state: BlockStateDocument = await this.findOne({ filter: {} });

    return state?.tables.includes(label) === true;
  }
}
