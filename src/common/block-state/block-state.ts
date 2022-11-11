import { MongoSource } from '@alien-worlds/api-core';
import { BlockStateSource } from './block-state.source';

export class BlockState {
  private source: BlockStateSource;

  constructor(mongo: MongoSource) {
    this.source = new BlockStateSource(mongo);
  }

  public async updateCurrentBlockNumber(value: bigint): Promise<boolean> {
    return this.source.updateCurrentBlockNumber(value);
  }
  public async getCurrentBlockNumber(): Promise<bigint> {
    return this.source.getCurrentBlockNumber();
  }
}
