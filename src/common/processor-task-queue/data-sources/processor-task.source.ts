import {
  CollectionMongoSource,
  DataSourceOperationError,
  MongoDB,
  MongoSource,
} from '@alien-worlds/api-core';
import { ProcessorTaskQueueConfig } from '../processor-task-queue.config';
import { ProcessorTaskDocument } from '../processor-task.types';

export class ProcessorTaskSource extends CollectionMongoSource<ProcessorTaskDocument> {
  private transactionOptions: MongoDB.TransactionOptions;

  constructor(mongoSource: MongoSource, private config: ProcessorTaskQueueConfig) {
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
          key: { short_id: 1, mode: 1, type: 1 },
          background: true,
        },
        {
          key: { short_id: 1, mode: 1, block_number: 1, hash: 1 },
          unique: true,
          background: true,
        },
      ],
    });

    this.transactionOptions = {
      readConcern: MongoDB.ReadConcern.fromOptions({
        level: <MongoDB.ReadConcernLevel>config?.readConcern || 'snapshot',
      }),
      writeConcern: MongoDB.WriteConcern.fromOptions({
        w: <MongoDB.W>config?.writeConcern || 'majority',
      }),
      readPreference: MongoDB.ReadPreference.fromString(
        config?.readPreference || 'primary'
      ),
    };
  }

  private async nextTaskWithinSession(mode?: string): Promise<ProcessorTaskDocument> {
    const { transactionOptions } = this;
    const session = this.mongoSource.client.startSession();

    try {
      session.startTransaction(transactionOptions);
      let filter: object;

      if (mode) {
        filter = {
          $and: [{ mode }, { error: { $exists: false } }],
        };
      } else {
        filter = { error: { $exists: false } };
      }

      const result = await this.collection.findOneAndDelete(filter, {
        sort: { block_timestamp: 1 },
        session,
      });
      await session.commitTransaction();
      return result.value;
    } catch (error) {
      await session.abortTransaction();
      throw DataSourceOperationError.fromError(error);
    } finally {
      await session.endSession();
    }
  }

  public async nextTask(mode?: string): Promise<ProcessorTaskDocument> {
    let filter: object;
    try {
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

      if (this.config.useSession) {
        return this.nextTaskWithinSession(mode);
      }

      const result = await this.collection.findOneAndDelete(filter, {
        sort: { block_timestamp: 1 },
      });
      return result.value;
    } catch (error) {
      throw DataSourceOperationError.fromError(error);
    }
  }

  // public async nextTask(mode?: string): Promise<ProcessorTaskDocument> {
  //   try {
  //     let filter: object;

  //     if (mode) {
  //       filter = {
  //         $and: [
  //           { mode },
  //           {
  //             $or: [
  //               { timestamp: { $exists: false } },
  //               /*
  //                 The trick to not use the same block range again on another thread/worker
  //                 - only when restarts
  //                */
  //               { timestamp: { $lt: new Date(Date.now() - 1000) } },
  //             ],
  //           },
  //         ],
  //       };
  //     } else {
  //       filter = {
  //         $or: [
  //           { timestamp: { $exists: false } },
  //           /*
  //             The trick to not use the same block range again on another thread/worker
  //             - only when restarts
  //            */
  //           { timestamp: { $lt: new Date(Date.now() - 1000) } },
  //         ],
  //       };
  //     }

  //     const result = await this.collection.findOneAndUpdate(
  //       filter,
  //       { $set: { timestamp: new Date() } },
  //       {
  //         sort: { timestamp: 1 },
  //         returnDocument: 'after',
  //       }
  //     );

  //     return result.value;
  //   } catch (error) {
  //     throw DataSourceOperationError.fromError(error);
  //   }
  // }
}
