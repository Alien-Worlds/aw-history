import { MongoSource } from '@alien-worlds/api-core';
import { Broadcast, startBroadcastClient } from '../common/broadcast';
import { Mode } from '../common/common.enums';
import { Worker } from '../common/workers';
import { DefaultWorkerLoader } from '../common/workers/worker-loader';
import { InternalBroadcastClientName } from '../internal-broadcast';
import { BlockRangeSharedData } from './block-range.types';

export default class BlockRangeWorkerLoader extends DefaultWorkerLoader {
  private mongoSource: MongoSource;
  private broadcast: Broadcast;

  public async setup(sharedData: BlockRangeSharedData): Promise<void> {
    const {
      config: { mongo, broadcast, mode },
    } = sharedData;
    this.mongoSource = await MongoSource.create(mongo);
    this.broadcast = await startBroadcastClient(
      mode === Mode.Replay
        ? InternalBroadcastClientName.BlockRangeReplayModeTask
        : InternalBroadcastClientName.BlockRangeDefaultModeTask,
      broadcast
    );
  }

  public async load(pointer: string, containerPath: string): Promise<Worker> {
    const { mongoSource, broadcast } = this;
    return super.load(pointer, containerPath, mongoSource, broadcast);
  }
}
