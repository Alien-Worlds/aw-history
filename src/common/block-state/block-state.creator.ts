import { log } from '@alien-worlds/api-core';
import {
  MongoConfig,
  MongoQueryBuilders,
  MongoSource,
} from '@alien-worlds/storage-mongodb';
import { BlockState } from './block-state';
import { UpdateBlockNumberMongoQueryBuilder } from './query-builders/update-block-number.mongo.query-builder';
import { BlockMongoCollection } from '../../reader';
import { BlockStateMongoMapper } from './block-state.mongo.mapper';

export class BlockStateCreator {
  public static async create(mongo: MongoSource | MongoConfig) {
    log(` *  Block State ... [starting]`);
    const mapper = new BlockStateMongoMapper();
    const queryBuilders = new MongoQueryBuilders();
    const updateBlockNumberQueryBuilder = new UpdateBlockNumberMongoQueryBuilder();
    const mongoSource =
      mongo instanceof MongoSource ? mongo : await MongoSource.create(mongo);
    const collection = new BlockMongoCollection(mongoSource);
    const state = new BlockState(
      collection,
      mapper,
      queryBuilders,
      updateBlockNumberQueryBuilder
    );

    log(` *  Block State ... [ready]`);
    return state;
  }
}
