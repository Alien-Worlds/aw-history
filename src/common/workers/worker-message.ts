export type ErrorJson = {
  name?: string;
  message?: string;
  stack?: string;
  [key: string]: unknown;
};

export type WorkerMessageContent<DataType = unknown> = {
  workerId: number;
  type: string;
  name: string;
  data?: DataType;
  error?: ErrorJson;
};

export type WorkerMessageHandler = (message: WorkerMessage) => void;

export class WorkerMessage<DataType = unknown> {
  public static create<DataType = unknown>({
    workerId,
    type,
    name,
    data,
    error,
  }: WorkerMessageContent<DataType>) {
    let errorJson: ErrorJson;
    if (error) {
      const { message, stack, name: errorName, ...rest } = error;
      errorJson = {
        message,
        stack,
        name: errorName,
        ...rest,
      };
    }

    return new WorkerMessage<DataType>(workerId, type, name, data, errorJson);
  }

  public static setup(workerId: number) {
    return new WorkerMessage(workerId, WorkerMessageType.System, WorkerMessageName.Setup);
  }

  public static setupComplete(workerId: number) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.SetupComplete
    );
  }

  public static setupFailure(workerId: number, error: Error) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.SetupFailure,
      error,
      <ErrorJson>error
    );
  }

  public static load(workerId: number, pointer: string) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.Load,
      pointer
    );
  }

  public static loadComplete(workerId: number) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.LoadComplete
    );
  }

  public static loadFailure(workerId: number, error: Error) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.LoadFailure,
      error,
      <ErrorJson>error
    );
  }

  public static dispose(workerId: number) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.Dispose
    );
  }

  public static disposeComplete(workerId: number) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.DisposeComplete
    );
  }

  public static disposeFailure(workerId: number, error: Error) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.DisposeComplete,
      error,
      <ErrorJson>error
    );
  }

  public static runTask<DataType = unknown>(workerId: number, value: DataType) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.Info,
      WorkerMessageName.RunTask,
      value
    );
  }

  public static use<DataType = unknown>(workerId: number, value: DataType) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.Info,
      WorkerMessageName.PassData,
      value
    );
  }

  public static taskResolved<DataType = unknown>(workerId: number, value: DataType) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.Info,
      WorkerMessageName.TaskResolved,
      value
    );
  }

  public static taskRejected(workerId: number, error: Error) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.Error,
      WorkerMessageName.TaskRejected,
      null,
      <ErrorJson>error
    );
  }

  public static taskProgress<DataType = unknown>(workerId: number, value: DataType) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.Info,
      WorkerMessageName.TaskProgress,
      value
    );
  }

  private constructor(
    public readonly workerId: number,
    public readonly type: string,
    public readonly name: string,
    public readonly data?: DataType,
    public readonly error?: ErrorJson
  ) {}

  public isTaskResolved(): boolean {
    return this.name === WorkerMessageName.TaskResolved;
  }

  public isTaskRejected(): boolean {
    return this.name === WorkerMessageName.TaskRejected;
  }

  public isTaskProgress(): boolean {
    return this.name === WorkerMessageName.TaskProgress;
  }

  public toJson(): object {
    const { workerId, type, name, data, error } = this;
    let errorJson = {};
    if (error) {
      const { message, stack, name: errorName, ...rest } = error;
      errorJson = {
        message,
        stack,
        name: errorName,
        ...rest,
      };
    }
    return {
      workerId,
      type,
      name,
      data,
      error: errorJson,
    };
  }
}

export enum WorkerMessageType {
  Error = 'error',
  Info = 'info',
  Warning = 'warning',
  Task = 'task',
  System = 'system',
}

export enum WorkerMessageName {
  Setup = 'setup',
  SetupComplete = 'setup_complete',
  SetupFailure = 'setup_failure',
  Load = 'load',
  LoadComplete = 'load_complete',
  LoadFailure = 'load_failure',
  Dispose = 'dispose',
  DisposeComplete = 'dispose_complete',
  DisposeFailure = 'dispose_failure',
  RunTask = 'run_task',
  PassData = 'pass_data',
  DataPassed = 'data_passed',
  TaskResolved = 'task_resolved',
  TaskRejected = 'task_rejected',
  TaskProgress = 'task_progress',
}
