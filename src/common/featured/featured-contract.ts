import { parseToBigInt } from '@alien-worlds/aw-core';

/**
 * Class representing a FeaturedContract
 * @class
 * @public
 */
export class FeaturedContract {
  /**
   * Creates a new instance of the FeaturedContract
   * @constructor
   * @param {string} id - The ID of the contract
   * @param {bigint} initialBlockNumber - The initial block number of the contract
   * @param {string} account - The account associated with the contract
   */
  constructor(
    public id: string,
    public initialBlockNumber: bigint,
    public account: string
  ) {}

  /**
   * Creates a new instance of FeaturedContract with a specified account and initial block number,
   * ID will be set to empty string by default
   * @static
   * @public
   * @param {string} account - The account associated with the contract
   * @param {string | number} initialBlockNumber - The initial block number of the contract
   * @returns {FeaturedContract} A new instance of FeaturedContract
   */
  public static create(account: string, initialBlockNumber: string | number) {
    return new FeaturedContract('', parseToBigInt(initialBlockNumber), account);
  }
}
