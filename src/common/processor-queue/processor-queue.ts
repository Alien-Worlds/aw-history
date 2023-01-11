import { log, MongoSource, ObjectId } from '@alien-worlds/api-core';
import { ProcessorQueueSource } from './processor-queue.source';
import { ProcessorTask } from './processor-task';

export class ProcessorQueue {
  private source: ProcessorQueueSource;

  constructor(mongo: MongoSource) {
    this.source = new ProcessorQueueSource(mongo);
  }

  public async nextTask(mode: string): Promise<ProcessorTask> {
    try {
      const dto = await this.source.nextTask(mode);
      return dto ? ProcessorTask.fromDocument(dto) : null;
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
