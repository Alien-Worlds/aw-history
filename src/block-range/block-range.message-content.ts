/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { deserialize, serialize } from 'v8';
import { BroadcastMessageContent } from '../common/broadcast';
import {
  FeaturedTrace,
  FeaturedDelta,
  BlockRangeMessageBuffer,
} from './block-range.types';
import { parseToFeaturedDeltas, parseToFeaturedTraces } from './block-range.utils';

export class BlockRangeMessageContent implements BroadcastMessageContent {
  public static create(
    startBlock: bigint,
    endBlock: bigint,
    mode: string,
    scanKey: string,
    traces: string | FeaturedTrace[],
    deltas: string | FeaturedDelta[]
  ): BlockRangeMessageContent {
    let featuredTraces: FeaturedTrace[] = [];
    let featuredDeltas: FeaturedDelta[] = [];

    if (Array.isArray(traces)) {
      featuredTraces = traces;
    } else {
      try {
        featuredTraces = JSON.parse(traces) as FeaturedTrace[];
      } catch (error) {
        featuredTraces = parseToFeaturedTraces(traces);
      }
    }

    if (Array.isArray(deltas)) {
      featuredDeltas = deltas;
    } else {
      try {
        featuredDeltas = JSON.parse(deltas) as FeaturedDelta[];
      } catch (error) {
        featuredDeltas = parseToFeaturedDeltas(deltas);
      }
    }

    return new BlockRangeMessageContent(
      mode,
      scanKey,
      featuredTraces,
      featuredDeltas,
      startBlock,
      endBlock
    );
  }

  public static fromBuffer(buffer: Buffer): BlockRangeMessageContent {
    const { mode, scanKey, featuredTraces, featuredDeltas, startBlock, endBlock } =
      deserialize(buffer) as BlockRangeMessageBuffer;

    return new BlockRangeMessageContent(
      mode,
      scanKey,
      featuredTraces,
      featuredDeltas,
      startBlock,
      endBlock
    );
  }

  private constructor(
    public readonly mode: string,
    public readonly scanKey: string,
    public readonly featuredTraces: FeaturedTrace[],
    public readonly featuredDeltas: FeaturedDelta[],
    public readonly startBlock: bigint,
    public readonly endBlock: bigint
  ) {}

  toBuffer(): Buffer {
    const { mode, scanKey, featuredTraces, featuredDeltas, startBlock, endBlock } = this;
    return serialize({
      mode,
      scanKey,
      featuredTraces,
      featuredDeltas,
      startBlock,
      endBlock,
    });
  }
}
