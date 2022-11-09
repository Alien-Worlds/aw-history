import { connectMongo, MongoConfig, MongoSource } from '@alien-worlds/api-core';
import { BlockState } from '../../block-range/block-state';

export const setupBlockState = async (mongo: MongoSource | MongoConfig) => {
  console.log('1');
  if (mongo instanceof MongoSource) {
    console.log('1a');
    return new BlockState(mongo);
  }
  console.log('1b');
  const db = await connectMongo(mongo);
  console.log('1c');
  return new BlockState(new MongoSource(db));
};
