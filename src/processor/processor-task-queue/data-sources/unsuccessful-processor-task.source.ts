import {
  CollectionMongoSource,
  MongoSource,
} from '@alien-worlds/api-core';
import { ProcessorTaskDocument } from '../processor-task.types';

export class UnsuccessfulProcessorTaskSource extends CollectionMongoSource<ProcessorTaskDocument> {
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'history_tools.unsuccessful_processor_tasks', {
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
}
