import { MongoDB, parseToBigInt } from '@alien-worlds/api-core';
import { serialize } from 'v8';
import {
  BlockDocument,
  BlockJson,
  BlockNumberWithIdDocument,
  BlockNumberWithIdJson,
} from '../../common/blockchain/block-reader/block-reader.types';
import { Abi } from '../../common/blockchain/block-content';

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
  public static fromJson(content: BlockJson): Block {
    const {
      head,
      last_irreversible,
      prev_block,
      this_block,
      block,
      traces,
      deltas,
      abi,
      is_micro_fork,
    } = content;

    return new Block(
      head ? BlockNumberWithId.fromJson(head) : null,
      this_block ? BlockNumberWithId.fromJson(this_block) : null,
      prev_block ? BlockNumberWithId.fromJson(prev_block) : null,
      last_irreversible ? BlockNumberWithId.fromJson(last_irreversible) : null,
      block,
      traces,
      deltas,
      abi ? Abi.fromHex(abi) : null,
      is_micro_fork || false
    );
  }

  public static fromDocument(content: BlockDocument): Block {
    const {
      head,
      last_irreversible,
      prev_block,
      this_block,
      block,
      traces,
      deltas,
      abi,
      is_micro_fork,
    } = content;

    return new Block(
      head ? BlockNumberWithId.fromDocument(head) : null,
      this_block ? BlockNumberWithId.fromDocument(this_block) : null,
      prev_block ? BlockNumberWithId.fromDocument(prev_block) : null,
      last_irreversible ? BlockNumberWithId.fromDocument(last_irreversible) : null,
      block.buffer,
      traces.buffer,
      deltas.buffer,
      abi ? Abi.fromHex(abi) : null,
      is_micro_fork || false
    );
  }

  private constructor(
    public readonly head: BlockNumberWithId,
    public readonly thisBlock: BlockNumberWithId,
    public readonly prevBlock: BlockNumberWithId,
    public readonly lastIrreversible: BlockNumberWithId,
    public readonly block: Uint8Array,
    public readonly traces: Uint8Array,
    public readonly deltas: Uint8Array,
    public readonly abi: Abi,
    public readonly isMicroFork: boolean,
    public readonly id?: string
  ) {}

  public toBuffer(): Buffer {
    const {
      head,
      thisBlock,
      prevBlock,
      lastIrreversible,
      block,
      traces,
      deltas,
      abi,
      isMicroFork: is_micro_fork,
    } = this;

    const data: BlockJson = {
      head: head.toJson(),
      this_block: thisBlock.toJson(),
      prev_block: prevBlock.toJson(),
      last_irreversible: lastIrreversible.toJson(),
      block,
      traces,
      deltas,
      is_micro_fork,
    };

    if (abi) {
      data.abi = abi.toHex();
    }

    return serialize(data);
  }

  public toJson(): BlockJson {
    const {
      head,
      thisBlock,
      prevBlock,
      lastIrreversible,
      block,
      traces,
      deltas,
      abi,
      isMicroFork: is_micro_fork,
    } = this;

    const json: BlockJson = {
      head: head.toJson(),
      this_block: thisBlock.toJson(),
      prev_block: prevBlock.toJson(),
      last_irreversible: lastIrreversible.toJson(),
      block,
      traces,
      deltas,
      is_micro_fork,
    };

    if (abi) {
      json.abi = abi.toHex();
    }

    return json;
  }

  public toDocument(): BlockDocument {
    const {
      id,
      head,
      thisBlock,
      prevBlock,
      lastIrreversible,
      block,
      traces,
      deltas,
      abi,
      isMicroFork: is_micro_fork,
    } = this;

    const document: BlockDocument = {
      block_id: thisBlock.blockId,
      block_num: MongoDB.Long.fromBigInt(thisBlock.blockNumber),
      head: head.toDocument(),
      this_block: thisBlock.toDocument(),
      prev_block: prevBlock.toDocument(),
      last_irreversible: lastIrreversible.toDocument(),
      block: new MongoDB.Binary(block),
      traces: new MongoDB.Binary(traces),
      deltas: new MongoDB.Binary(deltas),
      is_micro_fork,
    };

    if (id) {
      document._id = new MongoDB.ObjectId(id);
    }

    if (abi) {
      document.abi = abi.toHex();
    }

    return document;
  }
}
