import { Worker, DefaultWorkerLoader } from '@alien-worlds/aw-workers';
import { FilterSharedData } from './filter.types';
import FilterWorker from './filter.worker';
import { FilterWorkerLoaderDependencies } from './filter.worker-loader.dependencies';

export default class FilterWorkerLoader extends DefaultWorkerLoader<
  FilterSharedData,
  FilterWorkerLoaderDependencies
> {
  public async setup(sharedData: FilterSharedData): Promise<void> {
    const { config, featuredCriteriaPath } = sharedData;
    await super.setup(sharedData, config, featuredCriteriaPath);
  }

  public async load(): Promise<Worker> {
    const { dependencies, sharedData } = this;

    return new FilterWorker(dependencies, sharedData);
  }
}
