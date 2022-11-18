/* eslint-disable @typescript-eslint/require-await */
import { log, parseToBigInt } from '@alien-worlds/api-core';
import { setupBlockRangeBroadcast } from '../block-range/block-range.broadcast';
import { BlockRangeMessageContent } from '../block-range/block-range.message-content';
import { BlockRangeScanner, setupBlockRangeScanner } from '../common/block-range-scanner';
import { BlockState, setupBlockState } from '../common/block-state';
import { getLastIrreversibleBlockNumber } from '../common/blockchain';
import { BroadcastMessage } from '../common/broadcast';
import { Mode } from '../common/common.enums';
import { UnknownModeError } from '../common/common.errors';
import { FillerConfig } from './filler.config';

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
  } = config;

  let highEdge: bigint;
  let lowEdge: bigint;

  if (typeof startBlock !== 'bigint') {
    lowEdge = await blockState.getCurrentBlockNumber();
    log(`  Using current state block number ${lowEdge.toString()}`);
  }

  if (!endBlock) {
    highEdge = parseToBigInt(0xffffffff);
  }

  return BlockRangeMessageContent.create(
    startBlock ?? lowEdge,
    endBlock || highEdge,
    mode,
    scanKey
  );
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

  if (typeof startBlock !== 'bigint') {
    highEdge = await getLastIrreversibleBlockNumber(endpoint, chainId);
  } else {
    highEdge = startBlock + 1n;
  }

  return BlockRangeMessageContent.create(highEdge - 1n, highEdge, mode, scanKey);
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

  let highEdge: bigint;
  let lowEdge: bigint;

  if (typeof startBlock !== 'bigint') {
    lowEdge = await getLastIrreversibleBlockNumber(endpoint, chainId);
  }

  if (!endBlock) {
    highEdge = parseToBigInt(0xffffffff);
  }

  if (startBlock > endBlock) {
    throw new Error(
      `Error in the given range (${startBlock.toString()}-${endBlock.toString()}), the startBlock cannot be greater than the endBlock`
    );
  }

  // has it already (restarted replay) just send message
  if (await scanner.hasUnscannedBlocks(scanKey, startBlock, endBlock)) {
    log(
      `There is already a block range (${startBlock.toString()}-${endBlock.toString()}) scan entry in the database with the selected key "${scanKey}". Please select a new unique key if you want to start a new scan if you want to start a new scan.`
    );
  } else {
    const { error } = await scanner.createScanNodes(scanKey, startBlock, endBlock);
    if (error) {
      log(`An error occurred while creating the scan nodes`, error);
    }
  }

  return BlockRangeMessageContent.create(
    startBlock ?? lowEdge,
    endBlock || highEdge,
    mode,
    scanKey
  );
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
      message.ack();
      broadcast.sendMessage(blockRangeTaskInput).catch(log);
    });
  } catch (error) {
    log(error);
  }

  log(`Filler ${mode} mode ... [ready]`);
};
