import { DataSource, DataSourceError, Mapper, log } from '@alien-worlds/api-core';
import { ErrorJson } from '@alien-worlds/workers';
import { ProcessorTaskSource } from './processor-task.source';
import { ProcessorTask } from './processor-task';
import { ProcessorTaskModel } from './processor-task.types';

export class ProcessorTaskQueue {
  private constructor(
    protected source: ProcessorTaskSource<unknown>,
    protected mapper: Mapper<ProcessorTask, unknown>,
    protected unsuccessfulSource: DataSource<unknown>,
    protected onlyAdd = false
  ) {}

  public async nextTask(mode?: string): Promise<ProcessorTask> {
    // TODO: temporary solution - testing session options
    if (this.onlyAdd) {
      log(`Operation not allowed, queue created with option onlyAdd`);
      return;
    }

    try {
      const dto = await this.source.nextTask(mode);
      if (dto) {
        return this.mapper.toEntity(dto);
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
      const dtos = tasks.map(task => this.mapper.fromEntity(task));
      await source.insert(dtos);
    } catch (error) {
      const { error: concernError } = <DataSourceError>error;
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
      const document: ProcessorTaskModel = this.mapper.fromEntity(
        task
      ) as ProcessorTaskModel;
      document.error = { message, stack };

      await this.unsuccessfulSource.insert([document]);
    } catch (sourceError) {
      log(`Could not stash failed task due to: ${error.message}`);
    }
  }
}
