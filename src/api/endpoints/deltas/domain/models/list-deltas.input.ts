import { ListDeltasRequestDto } from '../../data/dtos/deltas.dto';
import { Request, parseToBigInt } from '@alien-worlds/api-core';
/**
 * @class
 */
export class ListDeltasInput {
  /**
   *
   * @param {ListDeltasRequestDto} dto
   * @returns {ListDeltasInput}
   */
  public static fromRequest(request: Request<ListDeltasRequestDto>): ListDeltasInput {
    const {
      params,
      query: { contract },
    } = request;
    const { name, timestamp_range, block_range, account } =
      params as ListDeltasRequestDto;
    let fromBlock: bigint;
    let toBlock: bigint;
    let fromDate: Date;
    let toDate: Date;

    if (block_range?.from) {
      fromBlock = parseToBigInt(block_range.from);
    }
    if (block_range?.to) {
      fromBlock = parseToBigInt(block_range.to);
    }

    if (timestamp_range?.from) {
      fromDate = new Date(timestamp_range.from);
    }
    if (timestamp_range?.to) {
      toDate = new Date(timestamp_range.to);
    }

    return new ListDeltasInput(
      contract,
      name,
      account,
      fromBlock,
      toBlock,
      fromDate,
      toDate
    );
  }
  /**
   *
   * @constructor
   * @private
   */
  private constructor(
    public readonly contract: string,
    public readonly name: string,
    public readonly account: string,
    public readonly startBlock: bigint,
    public readonly endBlock: bigint,
    public readonly startTimestamp: Date,
    public readonly endTimestamp: Date
  ) {}
}
