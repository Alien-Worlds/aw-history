import { Abi } from '../../common/abis';
import { AbisSerialize } from '../../common/abis/abis.serialize';
import { TraceProcessorTaskMessageContent } from '../broadcast/trace-processor-task.message-content';

export class ActionTraceProcessorTaskInput<DataType = unknown> {
  public static create<DataType = unknown>(
    abi: Abi,
    content: TraceProcessorTaskMessageContent
  ) {
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

    const deserializedData = AbisSerialize.deserializeAction<DataType>(
      account,
      name,
      data,
      abi.hex
    );

    return new ActionTraceProcessorTaskInput<DataType>(
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
    public readonly data: DataType
  ) {}
}
