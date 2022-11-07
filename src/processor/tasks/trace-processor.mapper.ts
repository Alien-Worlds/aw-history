import { Serialize } from 'eosjs';
import { arrayToHex, hexToUint8Array } from 'eosjs/dist/eosjs-serialize';
import { BroadcastMessageContentMapper } from '../../common/broadcast';
import { TraceProcessorTaskInput } from './trace-processor.task-input';

export class TraceProcessorBroadcastMapper
  implements BroadcastMessageContentMapper<TraceProcessorTaskInput, Buffer>
{
  public toContent(content: Buffer): TraceProcessorTaskInput {
    const sb = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
      array: new Uint8Array(content),
    });

    const blockNumber: bigint = Buffer.from(sb.getUint8Array(8)).readBigInt64BE();
    const timestamp = Buffer.from(sb.getUint8Array(4)).readUInt32BE(0);
    const blockTimestamp = new Date(timestamp * 1000);
    const transactionId = arrayToHex(sb.getUint8Array(32));
    const recvSequence = Buffer.from(sb.getUint8Array(8)).readBigInt64BE();
    const globalSequence = Buffer.from(sb.getUint8Array(8)).readBigInt64BE();
    const account = sb.getName();
    const name = sb.getName();
    const allocation = sb.getName();
    const data = sb.getBytes();

    return TraceProcessorTaskInput.create(
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

  public toSource(input: TraceProcessorTaskInput): Buffer {
    const {
      transactionId,
      account,
      name,
      recvSequence,
      globalSequence,
      data,
      blockNumber,
      blockTimestamp,
      allocation,
    } = input;

    const actionSb = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
    });

    actionSb.pushName(account);
    actionSb.pushName(name);
    actionSb.pushName(allocation);
    actionSb.pushBytes(data);

    const blockBuffer = Buffer.alloc(8);
    blockBuffer.writeBigInt64BE(blockNumber);
    const timestampBuffer = Buffer.alloc(4);
    timestampBuffer.writeUInt32BE(blockTimestamp.getTime() / 1000);
    const transactionIdBuffer = Buffer.from(hexToUint8Array(transactionId));
    const recvBuffer = Buffer.alloc(8);
    recvBuffer.writeBigInt64BE(recvSequence);
    const globalBuffer = Buffer.alloc(8);
    globalBuffer.writeBigInt64BE(globalSequence);
    const actionBuffer = Buffer.from(actionSb.array);

    return Buffer.concat([
      blockBuffer,
      timestampBuffer,
      transactionIdBuffer,
      recvBuffer,
      globalBuffer,
      actionBuffer,
    ]);
  }
}
