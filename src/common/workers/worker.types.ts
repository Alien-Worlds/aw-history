export type PathsByNames = {
  default?: string;
  [key: string]: string;
};

export type WorkersConfig<SharedDataType = unknown> = {
  threadsCount?: number;
  inviolableThreadsCount?: number;
  sharedData?: SharedDataType;
  [key: string]: unknown;
};

export type WorkerProxyOptions = {
  workerLoaderPath?: string;
};

export type WorkerPoolOptions = WorkersConfig & WorkerProxyOptions;

export type WorkerData = {
  pointer: string;
  sharedData?: unknown;
  options?: WorkerProxyOptions;
};

export type WorkerClass<T = unknown> = new (...args: unknown[]) => T;
