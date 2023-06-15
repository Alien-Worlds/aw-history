import { MongoCollectionSource, MongoSource } from '@alien-worlds/storage-mongodb';
import { BlockStateDocument } from './block-state.types';

export class BlockStateCollection extends MongoCollectionSource<BlockStateDocument> {
  constructor(source: MongoSource) {
    super(source, 'history_tools.block_state');
  }
}
