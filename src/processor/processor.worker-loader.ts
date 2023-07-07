import { Worker, DefaultWorkerLoader, WorkerContainer } from '@alien-worlds/workers';
import { ProcessorSharedData } from './processor.types';
import { Container } from '@alien-worlds/api-core';
import { ProcessorWorkerLoaderDependencies } from './processor.worker-loader.dependencies';

export default class ProcessorWorkerLoader extends DefaultWorkerLoader<
  ProcessorSharedData,
  ProcessorWorkerLoaderDependencies
> {
  protected workers: WorkerContainer;
  protected ioc: Container;

  public async setup(sharedData: ProcessorSharedData): Promise<void> {
    const { config, processorsPath } = sharedData;
    await super.setup(sharedData, config, processorsPath);
    this.ioc = new Container();
  }

  public async load(pointer: string): Promise<Worker> {
    const {
      dependencies: { dataSource, processorsPath },
    } = this;
    const { ioc, sharedData } = this;
    const processorClasses = await import(processorsPath);
    const worker: Worker = new processorClasses[pointer](
      {
        ioc,
        dataSource,
      },
      sharedData
    ) as Worker;
    return worker;
  }
}
