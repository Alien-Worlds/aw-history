import { deserialize } from 'v8';
import { AbisSerialize } from '../../common/abis/abis.serialize';
import {
  ActionProcessorContentModel,
  ProcessorTaskModel,
} from '../../common/processor-queue/processor-task.types';

export class ActionTraceProcessorInput<DataType = unknown> {
  public static create<DataType = unknown>(model: ProcessorTaskModel) {
    const { abi, content: buffer, hash } = model;
    const content: ActionProcessorContentModel = deserialize(buffer);
    const {
      actionTrace: {
        act: { account, data, name },
        receipt: { recvSequence, globalSequence },
      },
      blockNumber,
      blockTimestamp,
      transactionId,
    } = content;

    const deserializedData = AbisSerialize.deserializeAction<DataType>(
      account,
      name,
      data,
      abi
    );

    return new ActionTraceProcessorInput<DataType>(
      blockNumber,
      blockTimestamp,
      transactionId,
      account,
      name,
      recvSequence,
      globalSequence,
      deserializedData,
      hash
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
    public readonly data: DataType,
    public readonly dataHash: string
  ) {}
}