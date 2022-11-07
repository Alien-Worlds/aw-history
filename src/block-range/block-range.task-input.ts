/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { FeaturedTrace, FeaturedDelta } from './block-range.types';
import { parseToFeaturedDeltas, parseToFeaturedTraces } from './block-range.utils';

export class BlockRangeTaskInput {
  public static create(
    startBlock: bigint,
    endBlock: bigint,
    mode: string,
    scanKey: string,
    featuredTraces: string | FeaturedTrace[],
    featuredDeltas: string | FeaturedDelta[]
  ) {
    return new BlockRangeTaskInput(
      mode,
      scanKey,
      Array.isArray(featuredTraces)
        ? featuredTraces
        : parseToFeaturedTraces(featuredTraces),
      Array.isArray(featuredDeltas)
        ? featuredDeltas
        : parseToFeaturedDeltas(featuredDeltas),
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
}
