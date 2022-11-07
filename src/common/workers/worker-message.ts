export type WorkerMessageOptions<ContentType = unknown> = {
  pid: number;
  type: string;
  name: string;
  content?: ContentType;
  error?: Error;
};

export type WorkerMessageHandler = (message: WorkerMessage) => void;

export class WorkerMessage<ContentType = unknown> {
  public static create<ContentType = unknown>({
    pid,
    type,
    name,
    content,
    error,
  }: WorkerMessageOptions<ContentType>) {
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

    return new WorkerMessage<ContentType>(pid, type, name, content, errorJson);
  }

  public static runTask<ContentType = unknown>(pid: number, value: ContentType) {
    return new WorkerMessage(
      pid,
      WorkerMessageType.Info,
      WorkerMessageName.TaskResolved,
      value
    );
  }

  public static taskResolved<ContentType = unknown>(pid: number, value: ContentType) {
    return new WorkerMessage(
      pid,
      WorkerMessageType.Info,
      WorkerMessageName.TaskResolved,
      value
    );
  }

  public static taskRejected(pid: number, error: Error) {
    return new WorkerMessage(
      pid,
      WorkerMessageType.Error,
      WorkerMessageName.TaskRejected,
      null,
      error
    );
  }

  private constructor(
    public readonly pid: number,
    public readonly type: string,
    public readonly name: string,
    public readonly content: ContentType,
    public readonly error?: Error
  ) {}

  public isTaskResolved(): boolean {
    return this.name === WorkerMessageName.TaskResolved;
  }

  public toJson(): object {
    const { pid, type, name, content, error } = this;
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
      pid,
      type,
      name,
      content,
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
