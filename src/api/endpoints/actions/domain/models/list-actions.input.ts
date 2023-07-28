import { IO, UnknownObject } from '@alien-worlds/aw-core';
/**
 * @class
 */
export class ListActionsInput implements IO {
  /**
   *
   * @constructor
   * @private
   */
  constructor(
    public readonly contracts: string[],
    public readonly names: string[],
    public readonly accounts: string[],
    public readonly startBlock: bigint,
    public readonly endBlock: bigint,
    public readonly startTimestamp: Date,
    public readonly endTimestamp: Date,
    public readonly blockNumbers: bigint[],
    public readonly offset: number,
    public readonly limit: number
  ) {}

  public toJSON(): UnknownObject {
    const {
      contracts,
      names,
      accounts,
      blockNumbers,
      startBlock,
      endBlock,
      offset,
      limit,
    } = this;

    return {
      contracts,
      names,
      accounts,
      block_numbers: blockNumbers.map(blockNumber => blockNumber.toString()),
      from: startBlock.toString(),
      to: endBlock.toString(),
      offset,
      limit,
    };
  }
}
