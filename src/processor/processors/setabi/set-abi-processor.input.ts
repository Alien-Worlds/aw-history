import { Serialize } from 'eosjs';
import { deserialize } from 'v8';
import {
  ActionProcessorContentModel,
  ProcessorTaskModel,
} from '../../../common/processor-queue';
import { SetAbiData } from './set-abi.types';

export class SetAbiProcessorInput {
  public static create(model: ProcessorTaskModel) {
    const { content: buffer, hash } = model;
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

    const sb = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
      array: data,
    });

    const deserializedData: SetAbiData = {
      account: sb.getName(),
      abi: Buffer.from(sb.getBytes()).toString('hex').toUpperCase(),
    };

    return new SetAbiProcessorInput(
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
    public readonly data: SetAbiData,
    public readonly dataHash: string
  ) {}
}
