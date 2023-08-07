import { DataSource } from '@alien-worlds/aw-core';

export abstract class ProcessorTaskSource<T> extends DataSource<T> {
  public abstract nextTask(mode?: string): Promise<T>;
}
