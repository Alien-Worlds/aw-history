export class MissingWorkerPathError extends Error {}

export class InvalidPathError extends Error {
  constructor(path: string) {
    super(`The given path is invalid: ${path}`);
  }
}

export class WorkerPathMismatchError extends Error {
  constructor(path: string, globalPath: string) {
    super(`You cannot use path (${path}) when global is specified (${globalPath})`);
  }
}

export class WorkerNotFoundError extends Error {
  constructor(id: number) {
    super(`No worker with the specified ID (${id}) was found`);
  }
}

export class WorkerPoolPathsConflictError extends Error {
  constructor() {
    super(
      `default worker path and "containerPath" cannot be specified at the same time, both options are mutually exclusive.`
    );
  }
}
