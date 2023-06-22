import { ListActionsQueryParams } from '../actions.types';
import { Request, parseToBigInt } from '@alien-worlds/api-core';
/**
 * @class
 */
export class ListActionsInput {
  /**
   *
   * @param {ListActionsRequestDto} dto
   * @returns {ListActionsInput}
   */
  public static fromRequest(
    request: Request<unknown, unknown, ListActionsQueryParams>
  ): ListActionsInput {
    const {
      query: { contracts, names, accounts, from, to, limit, offset, block_numbers },
    } = request;

    let fromBlock: bigint;
    let toBlock: bigint;
    let fromDate: Date;
    let toDate: Date;
    let blockNumbers = [];

    if (from) {
      if (/^[0-9]+$/.test(from)) {
        fromBlock = parseToBigInt(from);
      } else {
        fromDate = new Date(from);
      }
    }

    if (to) {
      if (/^[0-9]+$/.test(to)) {
        toBlock = parseToBigInt(to);
      } else {
        toDate = new Date(to);
      }
    }

    if (block_numbers) {
      blockNumbers = block_numbers.split(',').map(parseToBigInt);
    }

    return new ListActionsInput(
      contracts ? contracts.split(',') : [],
      names ? names.split(',') : [],
      accounts ? accounts.split(',') : [],
      fromBlock,
      toBlock,
      fromDate,
      toDate,
      blockNumbers,
      offset || 0,
      limit || 10
    );
  }
  /**
   *
   * @constructor
   * @private
   */
  private constructor(
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
}
