import { Worker, DefaultWorkerLoader } from '@alien-worlds/workers';
import { FilterSharedData } from './filter.types';
import FilterWorker from './filter.worker';
import { FilterWorkerLoaderDependencies } from '@alien-worlds/history-tools-common';

export default class FilterWorkerLoader extends DefaultWorkerLoader<
  FilterSharedData,
  FilterWorkerLoaderDependencies
> {
  public async setup(sharedData: FilterSharedData): Promise<void> {
    const { config } = sharedData;
    await super.setup(sharedData, config);
  }

  public async load(): Promise<Worker> {
    const { dependencies, sharedData } = this;

    return new FilterWorker(dependencies, sharedData);
  }
}
