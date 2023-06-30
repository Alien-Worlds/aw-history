import { DataSource } from '@alien-worlds/api-core';

export abstract class ProcessorTaskSource<T> extends DataSource<T> {
  public abstract nextTask(mode?: string): Promise<T>;
}
