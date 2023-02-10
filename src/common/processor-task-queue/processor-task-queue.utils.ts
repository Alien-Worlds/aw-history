import { connectMongo, log, MongoConfig, MongoSource } from '@alien-worlds/api-core';
import { ProcessorTaskQueue } from './processor-task-queue';

export const setupProcessorTaskQueue = async (mongo: MongoSource | MongoConfig) => {
  log(` *  Processor Queue ... [starting]`);

  let state: ProcessorTaskQueue;

  if (mongo instanceof MongoSource) {
    state = new ProcessorTaskQueue(mongo);
  } else {
    const db = await connectMongo(mongo);
    state = new ProcessorTaskQueue(new MongoSource(db));
  }

  log(` *  Processor Queue ... [ready]`);
  return state;
};
