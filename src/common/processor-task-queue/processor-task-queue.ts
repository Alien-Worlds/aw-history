import { DataSourceBulkWriteError, log, MongoSource } from '@alien-worlds/api-core';
import { ProcessorTaskSource } from './data-sources/processor-task.source';
import { ProcessorTask } from './processor-task';
import { UnsuccessfulProcessorTaskSource } from './data-sources/unsuccessful-processor-task.source';

export class ProcessorTaskQueue {
  private source: ProcessorTaskSource;
  private unsuccessfulSource: UnsuccessfulProcessorTaskSource;

  constructor(mongo: MongoSource) {
    this.source = new ProcessorTaskSource(mongo);
    this.unsuccessfulSource = new UnsuccessfulProcessorTaskSource(mongo);
  }

  public async nextTask(mode?: string, unsuccessful?: boolean): Promise<ProcessorTask> {
    const source = unsuccessful ? this.unsuccessfulSource : this.source;
    try {
      const dto = await source.nextTask(mode);
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

  public async stashUnsuccessfulTask(task: ProcessorTask, error: Error): Promise<void> {
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
