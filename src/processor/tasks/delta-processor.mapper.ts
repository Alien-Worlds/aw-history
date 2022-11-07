import { Serialize } from 'eosjs';
import { BroadcastMessageContentMapper } from '../../common/broadcast';
import { DeltaProcessorTaskInput } from './delta-processor.task-input';

export class DeltaProcessorBroadcastMapper
  implements BroadcastMessageContentMapper<DeltaProcessorTaskInput, Buffer>
{
  public toContent(buffer: Buffer): DeltaProcessorTaskInput {
    const sb = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
      array: new Uint8Array(buffer),
    });

    const blockNumber: bigint = Buffer.from(sb.getUint8Array(8)).readBigInt64BE();
    const present = sb.get();
    const timestamp = Buffer.from(sb.getUint8Array(4)).readUInt32BE(0);
    const blockTimestamp = new Date(timestamp * 1000);
    sb.get(); // version
    const code = sb.getName();
    const scope = sb.getName();
    const table = sb.getName();
    const allocation = sb.getName();
    const primaryKey = Buffer.from(sb.getUint8Array(8)).readBigInt64BE();
    const payer = sb.getName();
    const data = sb.getBytes();

    return DeltaProcessorTaskInput.create(
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

  public toSource(input: DeltaProcessorTaskInput): Buffer {
    const { blockNumber, blockTimestamp, present, data, allocation } = input;

    const deltaSb = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
    });

    deltaSb.pushName(allocation);
    deltaSb.pushBytes(data);

    const blockBuffer = Buffer.alloc(8);
    blockBuffer.writeBigInt64BE(blockNumber);
    const timestampBuffer = Buffer.alloc(4);
    timestampBuffer.writeUInt32BE(blockTimestamp.getTime() / 1000);
    const presentBuffer = Buffer.from([present]);
    const dataBuffer = Buffer.from(deltaSb.array);

    return Buffer.concat([blockBuffer, presentBuffer, timestampBuffer, dataBuffer]);
  }
}
