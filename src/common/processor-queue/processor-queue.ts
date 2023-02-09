import {
  DataSourceBulkWriteError,
  log,
  MongoSource,
  MongoDB,
} from '@alien-worlds/api-core';
import { ProcessorQueueSource } from './processor-queue.source';
import { ProcessorTask } from './processor-task';

export class ProcessorQueue {
  private source: ProcessorQueueSource;

  constructor(mongo: MongoSource) {
    this.source = new ProcessorQueueSource(mongo);
  }

  public async nextTask(mode?: string): Promise<ProcessorTask> {
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

  public async addTasks(tasks: ProcessorTask[]): Promise<void> {
    try {
      const dtos = tasks.map(task => task.toDocument());
      await this.source.insertMany(dtos);
    } catch (error) {
      const { concernError } = <DataSourceBulkWriteError>error;
      const concernErrorMessage = (<Error>concernError)?.message || '';
      log(`Could not add tasks due to: ${error.message}. ${concernErrorMessage}`);
    }
  }

  public async stashTask(task: ProcessorTask, error: Error): Promise<void> {
    try {
      const { message, stack } = error;
      const dto = task.toDocument();
      dto.error = { message, stack };

      await this.source.insert(dto);
    } catch (sourceError) {
      log(`Could not stash failed task due to: ${error.message}`);
    }
  }
}
