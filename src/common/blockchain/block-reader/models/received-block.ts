import { parseToBigInt } from '@alien-worlds/api-core';
import { Serialize } from 'eosjs';
import { Block, BlockDto } from '../../block-content/block';
import { Delta, DeltaDto } from '../../block-content/delta';
import { Trace, TraceDto } from '../../block-content/trace';
import { BlockNumberWithIdDto, GetBlocksResultDto } from '../block-reader.dtos';
import { deserializeMessage } from '../block-reader.utils';

export class BlockNumberWithId {
  public static create(dto: BlockNumberWithIdDto) {
    const { block_id, block_num } = dto;
    return new BlockNumberWithId(parseToBigInt(block_num), block_id);
  }

  private constructor(
    public readonly blockNumber: bigint,
    public readonly blockId: string
  ) {}
}

export class ReceivedBlock {
  public static create(
    content: GetBlocksResultDto,
    types: Map<string, Serialize.Type>
  ): ReceivedBlock {
    const { head, last_irreversible, prev_block, this_block } = content;
    let block: Block;
    let traces: Trace[] = [];
    let deltas: Delta[] = [];

    if (content.block && content.block.length > 0) {
      const deserializedBlock = deserializeMessage<BlockDto>(
        'signed_block',
        content.block,
        types
      );
      block = Block.create(deserializedBlock);
    }

    if (content.traces && content.traces.length > 0) {
      const tracesByType = deserializeMessage<[[string, TraceDto]]>(
        'transaction_trace[]',
        content.traces,
        types
      );
      traces = tracesByType.map(([shipMessageName, traceDto]) =>
        Trace.create(shipMessageName, traceDto)
      );
    }

    if (content.deltas && content.deltas.length > 0) {
      const deltasByType = deserializeMessage<[[string, DeltaDto]]>(
        'table_delta[]',
        content.deltas,
        types
      );
      deltas = deltasByType.map(([shipMessageName, deltaDto]) =>
        Delta.create(shipMessageName, deltaDto)
      );
    }

    return new ReceivedBlock(
      BlockNumberWithId.create(head),
      BlockNumberWithId.create(this_block),
      BlockNumberWithId.create(prev_block),
      BlockNumberWithId.create(last_irreversible),
      block,
      traces,
      deltas
    );
  }

  private constructor(
    public readonly head: BlockNumberWithId,
    public readonly thisBlock: BlockNumberWithId,
    public readonly prevBlock: BlockNumberWithId,
    public readonly lastIrreversible: BlockNumberWithId,
    public readonly block: Block,
    public readonly traces: Trace[],
    public readonly deltas: Delta[]
  ) {}
}
