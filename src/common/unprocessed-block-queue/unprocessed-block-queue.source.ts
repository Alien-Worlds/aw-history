import { DataSource } from '@alien-worlds/api-core';

export abstract class UnprocessedBlockSource<T> extends DataSource<T> {
  public abstract next(): Promise<T>;
  public abstract bytesSize(): Promise<number>;
}
