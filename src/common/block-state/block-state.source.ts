import {
  CollectionMongoSource,
  Long,
  MongoSource,
  parseToBigInt,
} from '@alien-worlds/api-core';

export type BlockStateDocument = {
  name: string;
  value: Long;
};

export class BlockStateSource extends CollectionMongoSource<BlockStateDocument> {
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'history_tools_state');
  }

  public async updateCurrentBlockNumber(value: bigint): Promise<boolean> {
    const { modifiedCount, upsertedCount } = await this.update(
      { $max: { value: Long.fromBigInt(value) } },
      { name: 'current_block' },
      { upsert: true }
    );

    return modifiedCount > 0 || upsertedCount > 0;
  }

  public async getCurrentBlockNumber(): Promise<bigint> {
    const currentBlock = await this.findOne({ name: 'current_block' });

    return parseToBigInt(currentBlock ? currentBlock.value : Long.NEG_ONE);
  }
}
