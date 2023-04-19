import {
  DataSourceBulkWriteError,
  log,
  MongoConfig,
  MongoSource,
} from '@alien-worlds/api-core';
import { ProcessorTaskSource } from './data-sources/processor-task.source';
import { ProcessorTask } from './processor-task';
import { UnsuccessfulProcessorTaskSource } from './data-sources/unsuccessful-processor-task.source';
import { ProcessorTaskQueueConfig } from './processor-task-queue.config';
import { ErrorJson } from '../../common/workers/worker-message';

export class ProcessorTaskQueue {
  public static async create(
    mongo: MongoSource | MongoConfig,
    onlyAdd: boolean,
    queueConfig?: ProcessorTaskQueueConfig
  ) {
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
  }

  private source: ProcessorTaskSource;
  private unsuccessfulSource: UnsuccessfulProcessorTaskSource;

  private constructor(
    mongo: MongoSource,
    config: ProcessorTaskQueueConfig,
    private onlyAdd = false
  ) {
    this.source = new ProcessorTaskSource(mongo, config);
    this.unsuccessfulSource = new UnsuccessfulProcessorTaskSource(mongo);
  }

  public async nextTask(mode?: string): Promise<ProcessorTask> {
    // TODO: temporary solution - testing session options
    if (this.onlyAdd) {
      log(`Operation not allowed, queue created with option onlyAdd`);
      return;
    }

    try {
      const dto = await this.source.nextTask(mode);
      if (dto) {
        return ProcessorTask.fromDocument(dto);
      }
      return null;
    } catch (error) {
      log(`Could not get next task due to: ${error.message}`);
      return null;
    }
  }

  public async addTasks(tasks: ProcessorTask[], unsuccessful?: boolean): Promise<void> {
    const source = unsuccessful ? this.unsuccessfulSource : this.source;
    try {
      const dtos = tasks.map(task => task.toDocument());
      await source.insertMany(dtos);
    } catch (error) {
      const { concernError } = <DataSourceBulkWriteError>error;
      const concernErrorMessage = (<Error>concernError)?.message || '';
      log(`Could not add tasks due to: ${error.message}. ${concernErrorMessage}`);
    }
  }

  public async stashUnsuccessfulTask(
    task: ProcessorTask,
    error: ErrorJson | Error
  ): Promise<void> {
    try {
      const { message, stack } = error;
      const dto = task.toDocument();
      dto.error = { message, stack };

      await this.unsuccessfulSource.insert(dto);
    } catch (sourceError) {
      log(`Could not stash failed task due to: ${error.message}`);
    }
  }
}
