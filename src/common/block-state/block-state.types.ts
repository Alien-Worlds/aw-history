import { Long, ObjectId } from "@alien-worlds/api-core"

export type BlockStateDocument = {
    _id: ObjectId;
    last_modified_timestamp: Date;
    block_number: Long;
    actions: string[];
    tables: string[];
}

export type BlockStateData = {
    lastModifiedTimestamp: Date;
    blockNumber: bigint;
    actions: string[];
    tables: string[];
}