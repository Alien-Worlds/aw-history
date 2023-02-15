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
  }

  private async nextTaskWithinSession(mode?: string): Promise<ProcessorTaskDocument> {
    const { transactionOptions } = this;
    const session = this.mongoSource.client.startSession();

    try {
      session.startTransaction(transactionOptions);
      const filter = mode ? { mode } : {};
      const result = await this.collection.findOneAndDelete(filter, {
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
    try {
      const filter = mode ? { mode } : {};
      const result = await this.collection.findOneAndDelete(filter);

      return result.value;
    } catch (error) {
      throw DataSourceOperationError.fromError(error);
    }
  }
}
