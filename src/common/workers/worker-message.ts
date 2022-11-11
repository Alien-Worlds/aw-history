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

  public static runTask<DataType = unknown>(workerId: number, value: DataType) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.Info,
      WorkerMessageName.TaskResolved,
      value
    );
  }

  public static taskResolved<DataType = unknown>(
    workerId: number,
    value: DataType
  ) {
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
    public readonly data: DataType,
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
}

export enum WorkerMessageName {
  Start = 'start',
  TaskResolved = 'task_resolved',
  TaskRejected = 'task_rejected',
}
