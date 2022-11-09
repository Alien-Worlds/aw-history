import { log, parseToBigInt } from '@alien-worlds/api-core';
import {
  BlockRangeBroadcast,
  setupBlockRangeBroadcast,
} from '../block-range/block-range.broadcast';
import { BlockRangeMessageContent } from '../block-range/block-range.message-content';
import { BlockRangeScanner, setupBlockRangeScanner } from '../common/block-range-scanner';
import { BlockState, setupBlockState } from '../common/block-state';
import { getLastIrreversibleBlockNumber } from '../common/blockchain';
import { BroadcastMessageContentMapper } from '../common/broadcast';
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
    featuredTraces: traces,
    featuredDeltas: deltas,
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

  const input = BlockRangeMessageContent.create(
    startBlock || lowEdge,
    endBlock || highEdge,
    mode,
    scanKey,
    traces,
    deltas
  );

  log(
    `Starting filler in default mode. Block range ${input.startBlock}-${input.endBlock}`
  );

  await broadcast.sendMessage(input);
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
    featuredTraces: traces,
    featuredDeltas: deltas,
    blockchain: { chainId, endpoint },
  } = config;
  let highEdge: bigint;

  if (!startBlock) {
    highEdge = await getLastIrreversibleBlockNumber(endpoint, chainId);
  }

  await broadcast.sendMessage(
    BlockRangeMessageContent.create(
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
    featuredDeltas,
    featuredTraces,
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
      BlockRangeMessageContent.create(
        startBlock || lowEdge,
        endBlock || highEdge,
        mode,
        scanKey,
        featuredTraces,
        featuredDeltas
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
  const broadcast = await setupBlockRangeBroadcast(url, mapper);

  console.log('MODE', mode);
  try {
    if (mode === Mode.Default) {
      const blockState = await setupBlockState(config.mongo);
      console.log('start default');
      return startDefaultMode(broadcast, blockState, config);
    }

    if (mode === Mode.Replay) {
      const scanner = await setupBlockRangeScanner(config.mongo, config.scanner);
      console.log('start replay');
      return startReplayMode(broadcast, scanner, config);
    }

    if (mode === Mode.Test) {
      console.log('start test');
      return startTestMode(broadcast, config);
    }
  } catch (error) {
    log(error);
  }
};
