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
    const { config, processorsPath } = sharedData;
    await super.setup(sharedData, config, processorsPath);
    this.ioc = new Container();
  }

  public async load(pointer: string): Promise<Worker> {
    const {
      dependencies: { dataSource, serializer, processorsPath },
    } = this;
    const { ioc, sharedData } = this;
    const processorClasses = await import(processorsPath);
    const worker: Worker = new processorClasses[pointer](
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
