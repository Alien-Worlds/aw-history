import { DeltaRow } from '../../common/blockchain/block-content';

export class DeltaProcessorTaskInput {
  public static fromBlockchainData(
    name: string,
    code: string,
    scope: string,
    table: string,
    blockNumber: bigint,
    blockTimestamp: Date,
    row: DeltaRow,
  ) {
    const { present, data } = row;
    const allocation = `${name}:${code}:${scope}:${table}`;

    return new DeltaProcessorTaskInput(
      blockNumber,
      blockTimestamp,
      present,
      code,
      scope,
      table,
      null,
      null,
      data,
      allocation
    );
  }

  public static create(
    blockNumber: bigint,
    blockTimestamp: Date,
    present: number,
    code: string,
    scope: string,
    table: string,
    primaryKey: bigint,
    payer: string,
    data: Uint8Array,
    allocation: string
  ) {
    return new DeltaProcessorTaskInput(
      blockNumber,
      blockTimestamp,
      present,
      code,
      scope,
      table,
      primaryKey,
      payer,
      data,
      allocation
    );
  }

  private constructor(
    public readonly blockNumber: bigint,
    public readonly blockTimestamp: Date,
    public readonly present: number,
    public readonly code: string,
    public readonly scope: string,
    public readonly table: string,
    public readonly primaryKey: bigint,
    public readonly payer: string,
    public readonly data: Uint8Array,
    public readonly allocation: string
  ) {}
}
