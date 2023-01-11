import {
  CollectionMongoSource,
  DataSourceOperationError,
  MongoSource,
} from '@alien-worlds/api-core';
import { ProcessorTaskDocument } from './processor-task';

export class ProcessorQueueSource extends CollectionMongoSource<ProcessorTaskDocument> {
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'history_tools.processor_tasks');
  }

  public async nextTask(mode: string): Promise<ProcessorTaskDocument> {
    try {
      const result = await this.collection.findOneAndUpdate(
        {
          $and: [
            { mode },
            {
              $or: [
                { timestamp: { $exists: false } },
                /*
              The trick to not use the same block range again on another thread/worker
              - only when restarts
             */
                { timestamp: { $lt: new Date(Date.now() - 1000) } },
              ],
            },
          ],
        },

        { $set: { timestamp: new Date() } },
        {
          sort: { timestamp: 1 },
          returnDocument: 'after',
        }
      );

      return result.value;
    } catch (error) {
      throw DataSourceOperationError.fromError(error);
    }
  }
}
