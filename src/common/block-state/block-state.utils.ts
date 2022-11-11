import { connectMongo, log, MongoConfig, MongoSource } from '@alien-worlds/api-core';
import { BlockState } from './block-state';

export const setupBlockState = async (mongo: MongoSource | MongoConfig) => {
  log(` *  Block State ... [starting]`);

  let state: BlockState;

  if (mongo instanceof MongoSource) {
    state = new BlockState(mongo);
  } else {
    const db = await connectMongo(mongo);
    state = new BlockState(new MongoSource(db));
  }

  log(` *  Block State ... [ready]`);
  return state;
};
