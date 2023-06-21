import { DataSourceError } from '@alien-worlds/api-core';
import { MongoCollectionSource, MongoSource } from '@alien-worlds/storage-mongodb';
import { BlockMongoModel } from './unprocessed-block-queue.types';
import { UnprocessedBlockCollection } from './unprocessed-block-queue.collection';

export class UnprocessedBlockMongoCollection
  extends MongoCollectionSource<BlockMongoModel>
  implements UnprocessedBlockCollection<BlockMongoModel>
{
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'history_tools.unprocessed_blocks', {
      indexes: [
        {
          key: { 'this_block.block_num': 1 },
          unique: true,
          background: true,
        },
      ],
    });
  }

  public async next(): Promise<BlockMongoModel> {
    try {
      const result = await this.collection.findOneAndDelete({});
      return result.value;
    } catch (error) {
      throw DataSourceError.createError(error);
    }
  }

  public async bytesSize(): Promise<number> {
    const stats = await this.collection.stats();
    return stats.size;
  }
}
