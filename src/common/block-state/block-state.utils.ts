import { log, MongoConfig, MongoSource } from '@alien-worlds/api-core';
import { BlockState } from './block-state';

export const setupBlockState = async (mongo: MongoSource | MongoConfig) => {
  log(` *  Block State ... [starting]`);

  let state: BlockState;

  if (mongo instanceof MongoSource) {
    state = new BlockState(mongo);
  } else {
    const mongoSource = await MongoSource.create(mongo);
    state = new BlockState(mongoSource);
  }

  log(` *  Block State ... [ready]`);
  return state;
};
