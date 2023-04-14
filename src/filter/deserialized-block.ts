import { Block, BlockNumberWithId } from '../reader/blocks';
import {
  Delta,
  SignedBlock,
  SignedBlockJson,
  Trace,
} from '../common/blockchain/block-content';
import { TraceJson } from '../common/blockchain/block-content/trace';
import { DeltaJson } from '../common/blockchain/block-content/delta';
import { deserializeMessage } from '../reader';

export class DeserializedBlock {
  public static create(block: Block): DeserializedBlock {
    const { head, lastIrreversible, prevBlock, thisBlock, abi, isMicroFork } = block;
    const types = abi.getTypesMap();
    let traces: Trace[] = [];
    let deltas: Delta[] = [];
    let signedBlock: SignedBlock;

    if (block.block && block.block.length > 0) {
      const deserializedBlock = deserializeMessage<SignedBlockJson>(
        'signed_block',
        block.block,
        types
      );
      signedBlock = SignedBlock.create(deserializedBlock);
    }

    if (block.traces && block.traces.length > 0) {
      const tracesByType = deserializeMessage<[[string, TraceJson]]>(
        'transaction_trace[]',
        block.traces,
        types
      );
      traces = tracesByType.map(([shipMessageName, traceJson]) =>
        Trace.create(shipMessageName, traceJson)
      );
    }

    if (block.deltas && block.deltas.length > 0) {
      const deltasByType = deserializeMessage<[[string, DeltaJson]]>(
        'table_delta[]',
        block.deltas,
        types
      );
      deltas = deltasByType.map(([shipMessageName, deltaJson]) =>
        Delta.create(shipMessageName, deltaJson)
      );
    }

    return new DeserializedBlock(
      isMicroFork,
      head,
      thisBlock,
      prevBlock,
      lastIrreversible,
      signedBlock,
      traces,
      deltas
    );
  }

  private constructor(
    public readonly isMicroFork: boolean,
    public readonly head: BlockNumberWithId,
    public readonly thisBlock: BlockNumberWithId,
    public readonly prevBlock: BlockNumberWithId,
    public readonly lastIrreversible: BlockNumberWithId,
    public readonly block: SignedBlock,
    public readonly traces: Trace[],
    public readonly deltas: Delta[]
  ) {}
}
