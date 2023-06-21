import { Block } from '@alien-worlds/block-reader';
import { BlockMongoModel } from './unprocessed-block-queue.types';
import { parseToBigInt } from '@alien-worlds/api-core';
import { MongoDB } from '@alien-worlds/storage-mongodb';

export class UnprocessedBlockMongoMapper {
  public toEntity(model: BlockMongoModel): Block {
    const { block, traces, deltas, abi_version } = model;
    let head;
    let thisBlock;
    let prevBlock;
    let lastIrreversible;

    if (model.head) {
      head = {
        blockNumber: parseToBigInt(model.head.block_num),
        blockId: model.head.block_id,
      };
    }

    if (model.this_block) {
      thisBlock = {
        blockNumber: parseToBigInt(model.this_block.block_num),
        blockId: model.this_block.block_id,
      };
    }

    if (model.prev_block) {
      prevBlock = {
        blockNumber: parseToBigInt(model.prev_block.block_num),
        blockId: model.prev_block.block_id,
      };
    }

    if (model.last_irreversible) {
      lastIrreversible = {
        blockNumber: parseToBigInt(model.last_irreversible.block_num),
        blockId: model.last_irreversible.block_id,
      };
    }

    return new Block(
      head,
      lastIrreversible,
      prevBlock,
      thisBlock,
      block.buffer,
      traces.buffer,
      deltas.buffer,
      abi_version
    );
  }

  public fromEntity(entity: Block): BlockMongoModel {
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
    } = entity;

    const document: BlockMongoModel = {
      head: {
        block_id: head.blockId,
        block_num: MongoDB.Long.fromBigInt(head.blockNumber),
      },
      this_block: {
        block_id: thisBlock.blockId,
        block_num: MongoDB.Long.fromBigInt(thisBlock.blockNumber),
      },
      prev_block: {
        block_id: prevBlock.blockId,
        block_num: MongoDB.Long.fromBigInt(prevBlock.blockNumber),
      },
      last_irreversible: {
        block_id: lastIrreversible.blockId,
        block_num: MongoDB.Long.fromBigInt(lastIrreversible.blockNumber),
      },
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
