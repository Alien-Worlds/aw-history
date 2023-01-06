/* eslint-disable @typescript-eslint/require-await */
import { log, parseToBigInt } from '@alien-worlds/api-core';
import { setupBlockRangeBroadcast } from '../block-range/broadcast/block-range.broadcast';
import { BlockRangeMessageContent } from '../block-range/broadcast/block-range.message-content';
import { setupAbis } from '../common/abis/abis.utils';
import { BlockRangeScanner, setupBlockRangeScanner } from '../common/block-range-scanner';
import { BlockState, setupBlockState } from '../common/block-state';
import { getLastIrreversibleBlockNumber } from '../common/blockchain';
import { BroadcastMessage } from '../common/broadcast';
import { Mode } from '../common/common.enums';
import { UnknownModeError } from '../common/common.errors';
import { FillerConfig } from './filler.config';
import {
  EndBlockOutOfRangeError,
  NoAbisError,
  StartBlockHigherThanEndBlockError,
  UndefinedStartBlockError,
} from './filler.errors';

/**
 *
 * @param {Broadcast} broadcast
 * @param {FillerConfig} config
 */
export const prepareDefaultModeInput = async (
  blockState: BlockState,
  config: FillerConfig
) => {
  const {
    startBlock,
    endBlock,
    mode,
    scanner: { scanKey },
    blockchain: { chainId, endpoint },
  } = config;
  const lastIrreversibleBlock = await getLastIrreversibleBlockNumber(endpoint, chainId);
  const currentBlockNumber = await blockState.getCurrentBlockNumber();

  let highEdge: bigint;
  let lowEdge: bigint;

  if (typeof startBlock !== 'bigint' && currentBlockNumber) {
    log(`  Using current state block number ${lowEdge.toString()}`);
    lowEdge = await blockState.getCurrentBlockNumber();
  } else if (typeof startBlock !== 'bigint' && typeof currentBlockNumber !== 'bigint') {
    log(`  Using last irreversable block number ${lowEdge.toString()}`);
    lowEdge = lastIrreversibleBlock;
  } else if (startBlock < 0n) {
    log(`  Using last irreversable block number ${lowEdge.toString()} - ${startBlock}`);
    lowEdge = lastIrreversibleBlock + startBlock;
  } else {
    lowEdge = startBlock;
  }

  if (typeof endBlock !== 'bigint') {
    highEdge = parseToBigInt(0xffffffff);
  } else {
    highEdge = endBlock;
  }

  if (highEdge < lowEdge) {
    throw new StartBlockHigherThanEndBlockError(lowEdge, highEdge);
  }

  return BlockRangeMessageContent.create(lowEdge, highEdge, mode, scanKey);
};

/**
 *
 * @param {Broadcast} broadcast
 * @param {FillerConfig} config
 */
export const prepareTestModeInput = async (config: FillerConfig) => {
  const {
    startBlock,
    mode,
    scanner: { scanKey },
    blockchain: { chainId, endpoint },
  } = config;
  let highEdge: bigint;
  let lowEdge: bigint;

  if (typeof startBlock !== 'bigint') {
    highEdge = await getLastIrreversibleBlockNumber(endpoint, chainId);
    lowEdge = highEdge - 1n;
  } else {
    lowEdge = startBlock;
    highEdge = startBlock + 1n;
  }

  return BlockRangeMessageContent.create(lowEdge, highEdge, mode, scanKey);
};

/**
 *
 * @param {Broadcast} broadcast
 * @param {FillerConfig} config
 */
export const prepareReplayModeInput = async (
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

  const lowEdge = startBlock;
  let highEdge = endBlock;

  const lastIrreversibleBlock = await getLastIrreversibleBlockNumber(endpoint, chainId);

  if (typeof lowEdge !== 'bigint') {
    throw new UndefinedStartBlockError();
  }

  if (typeof endBlock !== 'bigint') {
    highEdge = lastIrreversibleBlock;
  } else {
    highEdge = endBlock;
  }

  if (highEdge > lastIrreversibleBlock) {
    throw new EndBlockOutOfRangeError(endBlock, lastIrreversibleBlock);
  }

  if (lowEdge > highEdge) {
    throw new StartBlockHigherThanEndBlockError(lowEdge, highEdge);
  }

  // has it already (restarted replay) just send message
  if (await scanner.hasUnscannedBlocks(scanKey, lowEdge, highEdge)) {
    log(
      `There is already a block range (${lowEdge.toString()}-${highEdge.toString()}) scan entry in the database with the selected key "${scanKey}". Please select a new unique key if you want to start a new scan if you want to start a new scan.`
    );
  } else {
    const { error } = await scanner.createScanNodes(scanKey, lowEdge, highEdge);
    if (error) {
      log(`An error occurred while creating the scan nodes`, error);
    }
  }

  return BlockRangeMessageContent.create(lowEdge, highEdge, mode, scanKey);
};

/**
 *
 * @param broadcastMessageMapper
 * @param config
 * @returns
 */
export const startFiller = async (config: FillerConfig) => {
  const { mode } = config;

  log(`Filler "${mode}" mode ... [starting]`);

  const broadcast = await setupBlockRangeBroadcast(config.broadcast);
  let blockRangeTaskInput: BlockRangeMessageContent;
  const abis = await setupAbis(config.mongo, config.abis, config.featured);

  // fetch latest abis to make sure that the blockchain data will be correctly deserialized
  log(` * Fetch abis ... [starting]`);
  const abisCount = await abis.fetchAbis();
  log(` * Fetch abis ... [ready]`);

  if (abisCount === 0) {
    throw new NoAbisError();
  }

  try {
    if (mode === Mode.Default) {
      const blockState = await setupBlockState(config.mongo);
      blockRangeTaskInput = await prepareDefaultModeInput(blockState, config);
    } else if (mode === Mode.Replay) {
      //
      const scanner = await setupBlockRangeScanner(config.mongo, config.scanner);
      blockRangeTaskInput = await prepareReplayModeInput(scanner, config);
    } else if (mode === Mode.Test) {
      //
      blockRangeTaskInput = await prepareTestModeInput(config);
    } else {
      //
      throw new UnknownModeError(mode);
    }

    broadcast.onBlockRangeReadyMessage(async (message: BroadcastMessage) => {
      broadcast.ack(message);
      broadcast.sendMessage(blockRangeTaskInput).catch(log);
    });
  } catch (error) {
    log(error);
  }

  log(`Filler ${mode} mode ... [ready]`);
};
