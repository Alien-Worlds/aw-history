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
    scanner: { scanKey },
  } = config;

  let highEdge: bigint;
  let lowEdge: bigint;

  if (!startBlock) {
    lowEdge = await blockState.getCurrentBlockNumber();
    log(`  Using current state block number ${lowEdge.toString()}`);
  }

  if (!endBlock) {
    highEdge = parseToBigInt(0xffffffff);
  }

  const input = BlockRangeMessageContent.create(
    startBlock || lowEdge,
    endBlock || highEdge,
    mode,
    scanKey
  );

  log(`      >  Block range set: ${input.startBlock}-${input.endBlock}`);

  broadcast.sendMessage(input).catch(log);
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
    blockchain: { chainId, endpoint },
  } = config;
  let highEdge: bigint;

  if (!startBlock) {
    highEdge = await getLastIrreversibleBlockNumber(endpoint, chainId);
  }

  const input = BlockRangeMessageContent.create(
    startBlock || highEdge - 1n,
    endBlock || startBlock + 1n || highEdge,
    mode,
    scanKey
  );

  log(`      >  Block range set: ${input.startBlock}-${input.endBlock}`);

  broadcast.sendMessage(input).catch(log);
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
  } = config;

  let highEdge: bigint;
  let lowEdge: bigint;

  if (!startBlock) {
    lowEdge = await getLastIrreversibleBlockNumber(endpoint, chainId);
  }

  if (!endBlock) {
    highEdge = parseToBigInt(0xffffffff);
  }

  if (startBlock > endBlock) {
    log(
      `Error in the given range (${startBlock.toString()}-${endBlock.toString()}), the startBlock cannot be greater than the endBlock`
    );
    return;
  }

  // has it already (restarted replay) just send message
  if (await scanner.hasUnscannedBlocks(scanKey, startBlock, endBlock)) {
    log(
      `Canceling a scan. There is already a block range (${startBlock.toString()}-${endBlock.toString()}) scan entry in the database with the selected key "${scanKey}". Please select a new unique key.`
    );
    return;
  }

  const { error } = await scanner.createScanNodes(scanKey, startBlock, endBlock);
  if (error) {
    log(`An error occurred while creating the scan nodes`, error);
    return;
  }
  const input = BlockRangeMessageContent.create(
    startBlock || lowEdge,
    endBlock || highEdge,
    mode,
    scanKey
  );

  log(`      >  Block range set: ${input.startBlock}-${input.endBlock}`);

  broadcast.sendMessage(input).catch(log);
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
  const { mode } = config;

  log(`Filler "${mode}" mode ... [starting]`);

  const broadcast = await setupBlockRangeBroadcast(config.broadcast, mapper);

  try {
    if (mode === Mode.Default) {
      const blockState = await setupBlockState(config.mongo);
      log(` *  ${mode.toUpperCase()} mode ... [ready]`);
      await startDefaultMode(broadcast, blockState, config);
    }

    if (mode === Mode.Replay) {
      const scanner = await setupBlockRangeScanner(config.mongo, config.scanner);
      log(` *  ${mode.toUpperCase()} mode ... [ready]`);
      await startReplayMode(broadcast, scanner, config);
    }

    if (mode === Mode.Test) {
      log(` *  ${mode.toUpperCase()} mode ... [ready]`);
      await startTestMode(broadcast, config);
    }
  } catch (error) {
    log(error);
  }
  log(`Filler ${mode} mode ... [ready]`);
};
