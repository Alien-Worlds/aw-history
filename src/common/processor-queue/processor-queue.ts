import { log, MongoSource, ObjectId } from '@alien-worlds/api-core';
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
      log(`No more tasks to process`);
      return null;
    } catch (error) {
      log(`Could not get next task due to: ${error.message}`);
      return null;
    }
  }

  public async hasTask(mode?: string): Promise<boolean> {
    const count = await this.countTasks(mode);
    return count > 0;
  }

  public async countTasks(mode?: string): Promise<number> {
    try {
      const params = mode ? { filter: { mode } } : {};
      return this.source.count(params);
    } catch (error) {
      log(`Could not count tasks due to: ${error.message}`);
      return 0;
    }
  }

  public async addTasks(tasks: ProcessorTask[]): Promise<void> {
    try {
      const dtos = tasks.map(task => task.toDocument());
      await this.source.insertMany(dtos);
    } catch (error) {
      log(`Could not add tasks due to: ${error.message}`);
    }
  }

  public async removeTask(id: string): Promise<void> {
    try {
      await this.source.remove({ _id: new ObjectId(id) });
    } catch (error) {
      log(`Could not remove task due to: ${error.message}`);
    }
  }

  public async removeTasks(ids: string[]): Promise<void> {
    try {
      await this.source.removeMany(ids.map(id => ({ _id: new ObjectId(id) })));
    } catch (error) {
      log(`Could not remove tasks due to: ${error.message}`);
    }
  }
}
