export type WorkerMessageContent<DataType = unknown> = {
  workerId: number;
  type: string;
  name: string;
  data?: DataType;
  error?: Error;
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
    let errorJson: Error;
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

  public static setup(workerId: number, pointer: string) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.Setup,
      pointer
    );
  }

  public static setupComplete(workerId: number) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.SetupComplete
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
      error
    );
  }

  private constructor(
    public readonly workerId: number,
    public readonly type: string,
    public readonly name: string,
    public readonly data?: DataType,
    public readonly error?: Error
  ) {}

  public isTaskResolved(): boolean {
    return this.name === WorkerMessageName.TaskResolved;
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
  Dispose = 'dispose',
  DisposeComplete = 'dispose_complete',
  RunTask = 'run_task',
  PassData = 'pass_data',
  DataPassed = 'data_passed',
  TaskResolved = 'task_resolved',
  TaskRejected = 'task_rejected',
}
