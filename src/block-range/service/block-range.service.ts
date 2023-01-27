import { setupAbis } from '../../common/abis';
import { setupBlockRangeScanner } from '../../common/block-range-scanner';
import { Mode } from '../../common/common.enums';
import { FeaturedContractContent } from '../../common/featured';
import { createWorkerPool } from '../../common/workers';
import { BlockRangeAddons, BlockRangeConfig } from '../block-range.config';
import { blockRangeWorkerLoaderPath } from '../block-range.consts';
import { BlockRangeDefaultService } from './block-range.default-service';
import { BlockRangeReplayService } from './block-range.replay-service';

export abstract class BlockRangeService {
  private static instance: BlockRangeDefaultService | BlockRangeReplayService;
  private static creatorPromise;

  private static async creator(
    mode: string,
    config: BlockRangeConfig,
    addons: BlockRangeAddons
  ): Promise<BlockRangeReplayService | BlockRangeDefaultService> {
    const featured = new FeaturedContractContent(config.featured, addons.matchers);
    if (mode === Mode.Replay) {
      const workerPool = await createWorkerPool({
        threadsCount: config.workers.threadsCount,
        sharedData: { config, featured: featured.toJson() },
        workerLoaderPath: blockRangeWorkerLoaderPath,
      });
      const scanner = await setupBlockRangeScanner(config.mongo, config.scanner);
      const abis = await setupAbis(config.mongo, config.abis, config.featured);

      BlockRangeService.instance = new BlockRangeReplayService(abis, workerPool, scanner);
    } else {
      // In the case of the default/test mode, the block range can have only one worker,
      // therefore, regardless of the settings, we create a pool with only one worker
      const workerPool = await createWorkerPool({
        threadsCount: 1,
        sharedData: { config, featured: featured.toJson() },
        workerLoaderPath: blockRangeWorkerLoaderPath,
      });

      BlockRangeService.instance = new BlockRangeDefaultService(workerPool);
    }
    // return default block range service if mode === Default or Test
    return BlockRangeService.instance;
  }

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
    if (BlockRangeService.instance && BlockRangeService.instance.mode === mode) {
      return BlockRangeService.instance as ServiceType;
    }

    if (BlockRangeService.instance && BlockRangeService.instance.mode !== mode) {
      BlockRangeService.creatorPromise = BlockRangeService.creator(mode, config, addons);
    } else if (!BlockRangeService.instance && !BlockRangeService.creatorPromise) {
      BlockRangeService.creatorPromise = BlockRangeService.creator(mode, config, addons);
    }

    return BlockRangeService.creatorPromise;
  }
}
