import { Serialize } from 'eosjs';
import { TraceProcessorMessageContent } from '../../broadcast/trace-processor.message-content';

export type SetAbiData = {
  account: string;
  abi: string;
};

export class SetAbiProcessorTaskInput {
  public static create(content: TraceProcessorMessageContent) {
    const {
      account,
      name,
      data,
      blockNumber,
      blockTimestamp,
      transactionId,
      recvSequence,
      globalSequence,
    } = content;

    const sb = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
      array: data,
    });

    const deserializedData: SetAbiData = {
      account: sb.getName(),
      abi: Buffer.from(sb.getBytes()).toString('hex').toUpperCase(),
    };

    return new SetAbiProcessorTaskInput(
      blockNumber,
      blockTimestamp,
      transactionId,
      account,
      name,
      recvSequence,
      globalSequence,
      deserializedData
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
    public readonly data: SetAbiData
  ) {}
}
