import {
  Worker,
  Container,
  DefaultWorkerLoader,
  ProcessorWorkerLoaderDependencies,
  WorkerContainer,
} from '@alien-worlds/history-tools-common';
import { ProcessorSharedData } from './processor.types';

export default class ProcessorWorkerLoader extends DefaultWorkerLoader<
  ProcessorSharedData,
  ProcessorWorkerLoaderDependencies
> {
  protected workers: WorkerContainer;
  protected ioc: Container;

  public async setup(sharedData: ProcessorSharedData): Promise<void> {
    const { config, featuredCriteria } = sharedData;
    await super.setup(sharedData, config, featuredCriteria);
    this.ioc = new Container();
  }

  public async load(pointer: string): Promise<Worker> {
    const {
      dependencies: { dataSource, serializer, processorClasses },
    } = this;
    const { ioc, sharedData } = this;
    const Class = processorClasses.get(pointer);
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
