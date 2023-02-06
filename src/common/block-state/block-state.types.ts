import { MongoDB } from "@alien-worlds/api-core"

export type BlockStateDocument = {
    _id: MongoDB.ObjectId;
    last_modified_timestamp: Date;
    block_number: MongoDB.Long;
    actions: string[];
    tables: string[];
}

export type BlockStateData = {
    lastModifiedTimestamp: Date;
    blockNumber: bigint;
    actions: string[];
    tables: string[];
}