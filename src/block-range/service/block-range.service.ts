import { log } from '@alien-worlds/api-core';
import { setupAbis } from '../../common/abis';
import { setupBlockRangeScanner } from '../../common/block-range-scanner';
import { Mode } from '../../common/common.enums';
import { FeaturedContractContent } from '../../common/featured';
import { createWorkerPool } from '../../common/workers';
import { BlockRangeAddons, BlockRangeConfig } from '../block-range.config';
import { BlockRangeDefaultService } from './block-range.default-service';
import { BlockRangeReplayService } from './block-range.replay-service';

let service: BlockRangeReplayService | BlockRangeDefaultService;

export abstract class BlockRangeService {
  public mode: Mode;
  public abstract isIdle(): boolean;
  public abstract dispose(): void;

  public static async getInstance<
    ServiceType = BlockRangeDefaultService | BlockRangeReplayService
  >(
    mode: string,
    config: BlockRangeConfig,
    addons: BlockRangeAddons
  ): Promise<ServiceType> {
    // if an instance already exists and is of the same type as expected
    // return that instance otherwise create a new one
    if (service && service.mode === mode) {
      return service as ServiceType;
    }

    const featured = new FeaturedContractContent(config.featured, addons.matchers);
    if (mode === Mode.Replay) {
      const workerPool = await createWorkerPool({
        threadsCount: config.workers.threadsCount,
        sharedData: { config, featured: featured.toJson() },
        workerLoaderPath: `${__dirname}/../block-range.worker-loader`,
      });
      const scanner = await setupBlockRangeScanner(config.mongo, config.scanner);
      const abis = await setupAbis(config.mongo, config.abis, config.featured);

      service = new BlockRangeReplayService(abis, workerPool, scanner);
    } else {
      // In the case of the default/test mode, the block range can have only one worker,
      // therefore, regardless of the settings, we create a pool with only one worker
      const workerPool = await createWorkerPool({
        threadsCount: 1,
        sharedData: { config, featured: featured.toJson() },
        workerLoaderPath: `${__dirname}/../block-range.worker-loader`,
      });

      service = new BlockRangeDefaultService(workerPool);
    }
    // return default block range service if mode === Default or Test
    return service as ServiceType;
  }
}
