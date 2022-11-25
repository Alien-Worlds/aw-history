export class MissingWorkerTaskPathError extends Error {}

export class WorkerTaskPathMismatchError extends Error {
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
    super(`"globalWorkerPath" and "containerPath" cannot be specified at the same time, both options are mutually exclusive.`);
  }
}
