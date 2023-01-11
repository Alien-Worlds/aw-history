import { connectMongo, log, MongoConfig, MongoSource } from '@alien-worlds/api-core';
import { ProcessorQueue } from './processor-queue';

export const setupProcessorQueue = async (mongo: MongoSource | MongoConfig) => {
  log(` *  Processor Queue ... [starting]`);

  let state: ProcessorQueue;

  if (mongo instanceof MongoSource) {
    state = new ProcessorQueue(mongo);
  } else {
    const db = await connectMongo(mongo);
    state = new ProcessorQueue(new MongoSource(db));
  }

  log(` *  Processor Queue ... [ready]`);
  return state;
};
