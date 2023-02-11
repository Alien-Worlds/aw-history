import { log, MongoConfig, MongoSource } from '@alien-worlds/api-core';
import { ProcessorTaskQueue } from './processor-task-queue';
import { ProcessorTaskQueueConfig } from './processor-task-queue.config';

export const setupProcessorTaskQueue = async (
  mongo: MongoSource | MongoConfig,
  onlyAdd: boolean,
  queueConfig?: ProcessorTaskQueueConfig
) => {
  log(` *  Processor Queue ... [starting]`);

  let state: ProcessorTaskQueue;

  if (mongo instanceof MongoSource) {
    if (!mongo.client) {
      throw new Error(
        'ProcessorTaskQueue requires MongoSource to provide a mongo client. Create Mongo Source using "MongoSource.create()"'
      );
    }

    state = new ProcessorTaskQueue(mongo, queueConfig, onlyAdd);
  } else {
    const mongoSource = await MongoSource.create(mongo);
    state = new ProcessorTaskQueue(mongoSource, queueConfig, onlyAdd);
  }

  log(` *  Processor Queue ... [ready]`);
  return state;
};
