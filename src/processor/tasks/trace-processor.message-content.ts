import { deserialize, serialize } from 'v8';
import { ActionTrace } from '../../common/blockchain/block-content';
import { BroadcastMessageContent } from '../../common/broadcast';
import { ProcessorMessageContent, TraceMessageBufferData } from '../processor.types';

export class TraceProcessorMessageContent
  implements BroadcastMessageContent, ProcessorMessageContent
{
  public static create(
    shipTraceMessageName: string,
    transactionId: string,
    actionTrace: ActionTrace,
    blockNumber: bigint,
    blockTimestamp: Date
  ) {
    const {
      shipMessageName: shipActionTraceMessageName,
      act: { account, name, data },
      receipt: { recvSequence, globalSequence },
    } = actionTrace;
    const label = `${shipTraceMessageName}:${shipActionTraceMessageName}:${account}:${name}`;

    return new TraceProcessorMessageContent(
      blockNumber,
      blockTimestamp,
      transactionId,
      account,
      name,
      recvSequence,
      globalSequence,
      data,
      label,
      shipTraceMessageName,
      shipActionTraceMessageName
    );
  }

  public static fromMessageBuffer(buffer: Buffer): TraceProcessorMessageContent {
    const {
      blockNumber,
      blockTimestamp,
      transactionId,
      account,
      name,
      recvSequence,
      globalSequence,
      data,
      label,
      shipTraceMessageName,
      shipActionTraceMessageName,
    } = deserialize(buffer) as TraceMessageBufferData;

    return new TraceProcessorMessageContent(
      blockNumber,
      blockTimestamp,
      transactionId,
      account,
      name,
      recvSequence,
      globalSequence,
      data,
      label,
      shipTraceMessageName,
      shipActionTraceMessageName
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
    public readonly label: string,
    public readonly shipTraceMessageName: string,
    public readonly shipActionTraceMessageName: string
  ) {}

  public toBuffer(): Buffer {
    const {
      blockNumber,
      blockTimestamp,
      transactionId,
      account,
      name,
      recvSequence,
      globalSequence,
      data,
      label,
      shipTraceMessageName,
      shipActionTraceMessageName,
    } = this;

    return serialize({
      blockNumber,
      blockTimestamp,
      transactionId,
      account,
      name,
      recvSequence,
      globalSequence,
      data,
      label,
      shipTraceMessageName,
      shipActionTraceMessageName,
    });
  }
}
