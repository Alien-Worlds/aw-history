/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Serialize } from 'eosjs';
import { BroadcastMessageContentMapper } from '../common/broadcast';
import { BlockRangeTaskInput } from './block-range.task-input';

export class BlockRangeBroadcastMapper
  implements BroadcastMessageContentMapper<BlockRangeTaskInput, Buffer>
{
  public toContent(buffer: Buffer): BlockRangeTaskInput {
    const sb = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
      array: new Uint8Array(buffer),
    });

    const mode = sb.getName();
    const scanKey = sb.getName();
    const traces = sb.getName();
    const deltas = sb.getName();

    const startBlock: bigint = Buffer.from(sb.getUint8Array(8)).readBigInt64BE();
    const endBlock: bigint = Buffer.from(sb.getUint8Array(8)).readBigInt64BE();

    return BlockRangeTaskInput.create(
      startBlock,
      endBlock,
      mode,
      scanKey,
      traces,
      deltas
    );
  }
  public toSource(content: BlockRangeTaskInput): Buffer {
    const {
      startBlock,
      endBlock,
      mode,
      scanKey,
      featuredTraces: traces,
      featuredDeltas: deltas,
    } = content;

    const sb = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
    });

    sb.pushName(mode);
    sb.pushName(scanKey);
    sb.pushName(JSON.stringify(traces));
    sb.pushName(JSON.stringify(deltas));

    const startBlockBuffer = Buffer.alloc(8);
    startBlockBuffer.writeBigInt64BE(startBlock);
    const endBlockBuffer = Buffer.alloc(8);
    endBlockBuffer.writeBigInt64BE(endBlock);

    return Buffer.concat([startBlockBuffer, endBlockBuffer]);
  }
}
