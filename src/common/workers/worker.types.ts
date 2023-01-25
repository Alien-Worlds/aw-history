export type WorkersConfig = {
  threadsCount?: number;
  inviolableThreadsCount?: number;
  containerPath?: string;
  globalWorkerPath?: string;
  sharedData?: unknown;
};

export type WorkerPoolOptions = WorkersConfig & {
  workerLoaderPath?: string;
};

export type WorkerProxyOptions = {
  containerPath?: string;
  workerLoaderPath?: string;
};

export type WorkerData = {
  pointer: string;
  sharedData?: unknown;
  options?: WorkerProxyOptions;
};

export type WorkerClass<T = unknown> = new (...args: unknown[]) => T;
