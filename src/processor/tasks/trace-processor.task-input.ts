import { ActionTrace } from '../../common/blockchain/block-content';

export class TraceProcessorTaskInput {
  public static fromBlockchainData(
    transactionId: string,
    actionTrace: ActionTrace,
    blockNumber: bigint,
    blockTimestamp: Date
  ) {
    const {
      type,
      act: { account, name, data },
      receipt: { recvSequence, globalSequence },
    } = actionTrace;
    const allocation = `${type}:${account}:${name}`;

    return new TraceProcessorTaskInput(
      blockNumber,
      blockTimestamp,
      transactionId,
      account,
      name,
      recvSequence,
      globalSequence,
      data,
      allocation
    );
  }

  public static create(
    blockNumber: bigint,
    blockTimestamp: Date,
    transactionId: string,
    account: string,
    name: string,
    recvSequence: bigint,
    globalSequence: bigint,
    data: Uint8Array,
    allocation: string
  ) {
    return new TraceProcessorTaskInput(
      blockNumber,
      blockTimestamp,
      transactionId,
      account,
      name,
      recvSequence,
      globalSequence,
      data,
      allocation
    );
  }

  private constructor(
    public readonly blockNumber: bigint,
    public readonly blockTimestamp: Date,
    public readonly transactionId: string,
    public readonly account: string,
    public readonly name: string,
    public readonly recvSequence: bigint,
    public readonly globalSequence: bigint,
    public readonly data: Uint8Array,
    public readonly allocation: string
  ) {}
}
