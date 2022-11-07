import { log, parseToBigInt } from '@alien-worlds/api-core';
import {
  BlockRangeBroadcast,
  createBlockRangeBroadcastOptions,
} from '../block-range/block-range.broadcast';
import { BlockRangeTaskInput } from '../block-range/block-range.task-input';
import { BlockRangeScanner, setupBlockRangeScanner } from '../common/block-range-scanner';
import { BlockState, setupBlockState } from '../common/block-state';
import { getLastIrreversibleBlockNumber } from '../common/blockchain';
import { BroadcastMessageContentMapper, setupBroadcast } from '../common/broadcast';
import { Mode } from '../common/enums';
import { FillerConfig } from './filler.config';

/**
 *
 * @param {Broadcast} broadcast
 * @param {FillerConfig} config
 */
export const startDefaultMode = async (
  broadcast: BlockRangeBroadcast,
  blockState: BlockState,
  config: FillerConfig
) => {
  const {
    startBlock,
    endBlock,
    mode,
    traces,
    deltas,
    scanner: { scanKey },
  } = config;

  let highEdge: bigint;
  let lowEdge: bigint;

  if (!startBlock) {
    lowEdge = await blockState.getCurrentBlockNumber();
  }

  if (!endBlock) {
    highEdge = parseToBigInt(0xffffffff);
  }

  await broadcast.sendMessage(
    BlockRangeTaskInput.create(
      startBlock || lowEdge,
      endBlock || highEdge,
      mode,
      scanKey,
      traces,
      deltas
    )
  );
};

/**
 *
 * @param {Broadcast} broadcast
 * @param {FillerConfig} config
 */
export const startTestMode = async (
  broadcast: BlockRangeBroadcast,
  config: FillerConfig
) => {
  const {
    startBlock,
    endBlock,
    mode,
    scanner: { scanKey },
    traces,
    deltas,
    blockchain: { chainId, endpoint },
  } = config;
  let highEdge: bigint;

  if (!startBlock) {
    highEdge = await getLastIrreversibleBlockNumber(endpoint, chainId);
  }

  await broadcast.sendMessage(
    BlockRangeTaskInput.create(
      startBlock || highEdge - 1n,
      endBlock || highEdge,
      mode,
      scanKey,
      traces,
      deltas
    )
  );
};

/**
 *
 * @param {Broadcast} broadcast
 * @param {FillerConfig} config
 */
export const startReplayMode = async (
  broadcast: BlockRangeBroadcast,
  scanner: BlockRangeScanner,
  config: FillerConfig
) => {
  const {
    blockchain: { chainId, endpoint },
    scanner: { scanKey },
    startBlock,
    endBlock,
    mode,
    deltas,
    traces,
  } = config;

  let highEdge: bigint;
  let lowEdge: bigint;

  if (!startBlock) {
    lowEdge = await getLastIrreversibleBlockNumber(endpoint, chainId);
  }

  if (!endBlock) {
    highEdge = parseToBigInt(0xffffffff);
  }

  // has it already (restarted replay) just send message
  if (await scanner.hasUnscannedBlocks(scanKey, startBlock, endBlock)) {
    log(
      `Canceling a scan. There is already a block range (${startBlock.toString()}-${endBlock.toString()}) scan entry in the database with the selected key "${scanKey}". Please select a new unique key.`
    );
    return;
  }

  if (await scanner.createScanNodes(scanKey, startBlock, endBlock)) {
    await broadcast.sendMessage(
      BlockRangeTaskInput.create(
        startBlock || lowEdge,
        endBlock || highEdge,
        mode,
        scanKey,
        traces,
        deltas
      )
    );
  }
};

/**
 *
 * @param broadcastMessageMapper
 * @param config
 * @returns
 */
export const startFiller = async (
  config: FillerConfig,
  mapper?: BroadcastMessageContentMapper
) => {
  const {
    mode,
    broadcast: { url },
  } = config;
  const blockRangeBroadcastOptions = createBlockRangeBroadcastOptions(mapper);
  const broadcast = await setupBroadcast<BlockRangeBroadcast>(
    url,
    blockRangeBroadcastOptions
  );

  try {
    if (mode === Mode.default) {
      const blockState = await setupBlockState(config.mongo);
      return startDefaultMode(broadcast, blockState, config);
    }

    if (mode === Mode.replay) {
      const scanner = await setupBlockRangeScanner(config.mongo, config.scanner);
      return startReplayMode(broadcast, scanner, config);
    }

    if (mode === Mode.test) {
      return startTestMode(broadcast, config);
    }
  } catch (error) {
    log(error);
  }
};
