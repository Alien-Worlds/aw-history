/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { deserialize, serialize } from 'v8';
import { BroadcastMessageContent } from '../common/broadcast';
import { BlockRangeMessageBuffer } from './block-range.types';

export class BlockRangeMessageContent implements BroadcastMessageContent {
  public static create(
    startBlock: bigint,
    endBlock: bigint,
    mode: string,
    scanKey: string
  ): BlockRangeMessageContent {
    return new BlockRangeMessageContent(mode, scanKey, startBlock, endBlock);
  }

  public static fromBuffer(buffer: Buffer): BlockRangeMessageContent {
    const { mode, scanKey, startBlock, endBlock } = deserialize(
      buffer
    ) as BlockRangeMessageBuffer;

    return new BlockRangeMessageContent(mode, scanKey, startBlock, endBlock);
  }

  private constructor(
    public readonly mode: string,
    public readonly scanKey: string,
    public readonly startBlock: bigint,
    public readonly endBlock: bigint
  ) {}

  toBuffer(): Buffer {
    const { mode, scanKey, startBlock, endBlock } = this;
    return serialize({
      mode,
      scanKey,
      startBlock,
      endBlock,
    });
  }
}
