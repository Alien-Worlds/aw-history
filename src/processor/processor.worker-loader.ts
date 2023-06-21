import { DefaultWorkerLoader, Worker, WorkerContainer } from '@alien-worlds/workers';
import { ProcessorSharedData } from './processor.types';
import { ProcessorWorkerLoaderDependencies } from './processor.worker-loader.dependencies';
import { Container } from '@alien-worlds/api-core';

export default class ProcessorWorkerLoader extends DefaultWorkerLoader<
  ProcessorSharedData,
  ProcessorWorkerLoaderDependencies
> {
  protected workers: WorkerContainer;
  protected ioc: Container;

  public async setup(sharedData: ProcessorSharedData): Promise<void> {
    const { config } = sharedData;
    await super.setup(sharedData, config);
    this.ioc = new Container();
  }

  public async load(pointer: string): Promise<Worker> {
    const {
      dependencies: { dataSource, serializer, workers },
    } = this;
    const { ioc, sharedData } = this;
    const Class = workers.get(pointer);
    const worker: Worker = new Class(
      {
        ioc,
        dataSource,
        serializer,
      },
      sharedData
    ) as Worker;
    return worker;
  }
}
