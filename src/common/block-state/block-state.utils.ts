import { connectMongo, MongoConfig, MongoSource } from '@alien-worlds/api-core';
import { BlockState } from './block-state';

export const setupBlockState = async (mongo: MongoSource | MongoConfig) => {
  if (mongo instanceof MongoSource) {
    return new BlockState(mongo);
  }

  const db = await connectMongo(mongo);

  return new BlockState(new MongoSource(db));
};
