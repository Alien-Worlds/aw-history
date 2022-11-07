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
