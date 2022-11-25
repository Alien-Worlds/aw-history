import { WorkerClass } from "./worker.types";

export class WorkerContainer {
  private bindings: Map<string, WorkerClass> = new Map();

  bind<T = unknown>(label: string, workerClass: WorkerClass<T>): void {
    this.bindings.set(label, workerClass);
  }

  get<T = unknown>(label: string): WorkerClass<T> {
    return this.bindings.get(label) as WorkerClass<T>;
  }
}
