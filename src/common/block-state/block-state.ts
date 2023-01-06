import { log, MongoSource } from '@alien-worlds/api-core';
import { BlockStateSource } from './block-state.source';

export class BlockState {
  private source: BlockStateSource;

  constructor(mongo: MongoSource) {
    this.source = new BlockStateSource(mongo);
  }

  public async updateCurrentBlockNumber(value: bigint): Promise<boolean> {
    return this.source.updateCurrentBlockNumber(value);
  }
  /**
   * Returns current block number or -1
   * @returns 
   */
  public async getCurrentBlockNumber(): Promise<bigint> {
    const currentBlockNumber = await this.source.getCurrentBlockNumber();
    log(
      `Current state block number: ${
        currentBlockNumber ? currentBlockNumber.toString() : currentBlockNumber
      }`
    );
    return currentBlockNumber;
  }
}
