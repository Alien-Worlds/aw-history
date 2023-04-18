import { MongoDB, parseToBigInt } from '@alien-worlds/api-core';
import {
  BlockDocument,
  BlockJson,
  BlockNumberWithIdDocument,
  BlockNumberWithIdJson,
} from './block.types';

export class BlockNumberWithId {
  public static fromJson(dto: BlockNumberWithIdJson) {
    const { block_id, block_num } = dto;
    return new BlockNumberWithId(parseToBigInt(block_num), block_id);
  }

  public static fromDocument(dto: BlockNumberWithIdDocument) {
    const { block_id, block_num } = dto;
    return new BlockNumberWithId(parseToBigInt(block_num), block_id);
  }

  private constructor(
    public readonly blockNumber: bigint,
    public readonly blockId: string
  ) {}

  public toJson() {
    return {
      block_num: this.blockNumber.toString(),
      block_id: this.blockId,
    };
  }

  public toDocument() {
    return {
      block_num: MongoDB.Long.fromBigInt(this.blockNumber),
      block_id: this.blockId,
    };
  }
}

export class Block {
  public static fromJson(json: BlockJson): Block {
    const { block, traces, deltas, abi_version } = json;
    const head = BlockNumberWithId.fromJson(json.head);
    const lastIrreversible = BlockNumberWithId.fromJson(json.last_irreversible);
    const prevBlock = BlockNumberWithId.fromJson(json.prev_block);
    const thisBlock = BlockNumberWithId.fromJson(json.this_block);

    return new Block(
      head,
      lastIrreversible,
      prevBlock,
      thisBlock,
      block,
      traces,
      deltas,
      abi_version
    );
  }

  public static fromDocument(content: BlockDocument): Block {
    const { block, traces, deltas, _id, abi_version } = content;
    const head = BlockNumberWithId.fromDocument(content.head);
    const lastIrreversible = BlockNumberWithId.fromDocument(content.last_irreversible);
    const prevBlock = BlockNumberWithId.fromDocument(content.prev_block);
    const thisBlock = BlockNumberWithId.fromDocument(content.this_block);

    return new Block(
      head,
      lastIrreversible,
      prevBlock,
      thisBlock,
      block.buffer,
      traces.buffer,
      deltas.buffer,
      abi_version,
      _id.toString()
    );
  }

  private constructor(
    public readonly head: BlockNumberWithId,
    public readonly lastIrreversible: BlockNumberWithId,
    public readonly prevBlock: BlockNumberWithId,
    public readonly thisBlock: BlockNumberWithId,
    public readonly block: Uint8Array,
    public readonly traces: Uint8Array,
    public readonly deltas: Uint8Array,
    public readonly abiVersion?: string,
    public readonly id?: string
  ) {}

  public toJson(): BlockJson {
    const { head, thisBlock, prevBlock, lastIrreversible, block, traces, deltas, abiVersion } = this;

    const json: BlockJson = {
      head: head.toJson(),
      this_block: thisBlock.toJson(),
      prev_block: prevBlock.toJson(),
      last_irreversible: lastIrreversible.toJson(),
      block,
      traces,
      deltas,
    };

    if (abiVersion) {
      json.abi_version = abiVersion;
    }

    return json;
  }

  public toDocument(): BlockDocument {
    const {
      head,
      thisBlock,
      prevBlock,
      lastIrreversible,
      block,
      traces,
      deltas,
      id,
      abiVersion,
    } = this;

    const document: BlockDocument = {
      head: head.toDocument(),
      this_block: thisBlock.toDocument(),
      prev_block: prevBlock.toDocument(),
      last_irreversible: lastIrreversible.toDocument(),
      block: new MongoDB.Binary(block),
      traces: new MongoDB.Binary(traces),
      deltas: new MongoDB.Binary(deltas),
    };

    if (abiVersion) {
      document.abi_version = abiVersion;
    }

    if (id) {
      document._id = new MongoDB.ObjectId(id);
    }

    return document;
  }
}
