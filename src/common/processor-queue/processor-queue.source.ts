import {
  CollectionMongoSource,
  DataSourceOperationError,
  MongoSource,
} from '@alien-worlds/api-core';
import { ProcessorTaskDocument } from './processor-task.types';

export class ProcessorQueueSource extends CollectionMongoSource<ProcessorTaskDocument> {
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'history_tools.processor_tasks', {
      indexes: [
        {
          key: { block_number: 1 },
          background: true,
        },
        {
          key: { timestamp: 1, block_number: 1 },
          background: true,
        },
        {
          key: { mode: 1, type: 1 },
          background: true,
        },
        {
          key: { label: 1, mode: 1, type: 1 },
          background: true,
        },
        {
          key: { label: 1, mode: 1, block_number: 1, hash: 1 },
          unique: true,
          background: true,
        },
      ],
    });
  }

  public async nextTask(mode?: string): Promise<ProcessorTaskDocument> {
    try {
      let filter: object;

      if (mode) {
        filter = {
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
        };
      } else {
        filter = {
          $or: [
            { timestamp: { $exists: false } },
            /*
              The trick to not use the same block range again on another thread/worker
              - only when restarts
             */
            { timestamp: { $lt: new Date(Date.now() - 1000) } },
          ],
        };
      }

      const result = await this.collection.findOneAndUpdate(
        filter,
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
