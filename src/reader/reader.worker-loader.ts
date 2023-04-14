import { BlockReader } from '../common/blockchain';
import { Worker } from '../common/workers';
import { DefaultWorkerLoader } from '../common/workers/worker-loader';
import { ReaderSharedData } from './reader.worker';

export default class ReaderWorkerLoader extends DefaultWorkerLoader {
  private blockReader: BlockReader;

  public async setup(sharedData: ReaderSharedData): Promise<void> {
    const {
      config: { blockReader },
    } = sharedData;
    this.blockReader = await BlockReader.create(blockReader);
  }

  public async load(pointer: string): Promise<Worker> {
    const { blockReader } = this;
    return super.load(pointer, { blockReader });
  }
}
