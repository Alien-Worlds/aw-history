import { log, parseToBigInt } from '@alien-worlds/api-core';
import { BlockRangeScanner } from '../reader/block-range-scanner';
import { BlockState } from '../common/block-state';
import { Mode } from '../common/common.enums';
import { UnknownModeError } from '../common/common.errors';
import { BlockRangeData, BootstrapConfig } from './bootstrap.types';
import {
  StartBlockHigherThanEndBlockError,
  UndefinedStartBlockError,
  EndBlockOutOfRangeError,
} from './bootstrap.errors';
import { Blockchain } from '../common';

export const createBlockRangeTaskInput = (
  blockState: BlockState,
  scanner: BlockRangeScanner,
  config: BootstrapConfig
) => {
  const { mode } = config;
  if (mode === Mode.Default) {
    return createDefaultModeBlockRange(blockState, config);
  } else if (mode === Mode.Replay) {
    //
    return createReplayModeBlockRange(scanner, config);
  } else if (mode === Mode.Test) {
    //
    return createTestModeBlockRange(config);
  } else {
    //
    throw new UnknownModeError(mode);
  }
};

/**
 *
 * @param {Broadcast} broadcast
 * @param {BootstrapConfig} config
 */
export const createDefaultModeBlockRange = async (
  blockState: BlockState,
  config: BootstrapConfig
): Promise<BlockRangeData> => {
  const {
    startBlock,
    endBlock,
    mode,
    scanner: { scanKey },
    startFromHead,
    maxBlockNumber,
  } = config;
  const blockchain = await Blockchain.create(config.blockchain);
  const lastIrreversibleBlock = await blockchain.getLastIrreversibleBlockNumber();
  const headBlock = await blockchain.getHeadBlockNumber();
  const { content: currentBlockNumber } = await blockState.getBlockNumber();

  log(`  Current head block number: ${headBlock.toString()}`);
  log(`  Current last irreversible block number: ${lastIrreversibleBlock.toString()}`);
  log(`  Current state block number: ${currentBlockNumber.toString()}`);

  let highEdge: bigint;
  let lowEdge: bigint;

  if (currentBlockNumber > 0n) {
    lowEdge = currentBlockNumber + 1n;
    log(`  Using the current state block number (+1) ${lowEdge.toString()} as a start block`);
  } else {
    if (startBlock < 0n) {
      if (startFromHead) {
        lowEdge = headBlock + startBlock;
        log(
          `  Using the offset (${startBlock.toString()}) from the head block number as a start block`
        );
      } else {
        lowEdge = lastIrreversibleBlock + startBlock;
        log(
          `  Using the offset (${startBlock.toString()}) from the last irreversable block number as a start block`
        );
      }
    } else if (startBlock > 0n) {
      lowEdge = startBlock;
    } else if (startFromHead) {
      lowEdge = headBlock;
      log(`  Using the head block number ${lowEdge.toString()} as a start block`);
    } else {
      lowEdge = lastIrreversibleBlock;
      log(
        `  Using the last irreversable block number ${lowEdge.toString()} as a start block`
      );
    }
  }

  if (typeof endBlock !== 'bigint') {
    highEdge = parseToBigInt(maxBlockNumber || 0xffffffff);
  } else {
    log(
      `  Using the end block number specified in the variables: ${endBlock.toString()} (exclusive) as an end block`
    );
    highEdge = endBlock;
  }

  if (highEdge < lowEdge) {
    throw new StartBlockHigherThanEndBlockError(lowEdge, highEdge);
  }

  return { startBlock: lowEdge, endBlock: highEdge, mode, scanKey };
};

/**
 *
 * @param {Broadcast} broadcast
 * @param {BootstrapConfig} config
 */
export const createTestModeBlockRange = async (
  config: BootstrapConfig
): Promise<BlockRangeData> => {
  const {
    startBlock,
    mode,
    scanner: { scanKey },
    startFromHead,
  } = config;

  const blockchain = await Blockchain.create(config.blockchain);
  const lastIrreversibleBlock = await blockchain.getLastIrreversibleBlockNumber();
  const headBlock = await blockchain.getHeadBlockNumber();

  let highEdge: bigint;
  let lowEdge: bigint;

  if (typeof startBlock !== 'bigint') {
    highEdge = startFromHead ? headBlock : lastIrreversibleBlock;
    lowEdge = highEdge - 1n;
  } else {
    lowEdge = startBlock;
    highEdge = startBlock + 1n;
  }

  return { startBlock: lowEdge, endBlock: highEdge, mode, scanKey };
};

/**
 *
 * @param {Broadcast} broadcast
 * @param {BootstrapConfig} config
 */
export const createReplayModeBlockRange = async (
  scanner: BlockRangeScanner,
  config: BootstrapConfig
): Promise<BlockRangeData> => {
  const {
    scanner: { scanKey },
    startBlock,
    endBlock,
    mode,
  } = config;

  const lowEdge = startBlock;
  let highEdge = endBlock;

  const blockchain = await Blockchain.create(config.blockchain);
  const lastIrreversibleBlock = await blockchain.getLastIrreversibleBlockNumber();

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
    log(`
/*
 There is already a block range (${lowEdge.toString()}-${highEdge.toString()}) scan entry in the database with the selected key "${scanKey}". 
 Please select a new unique key if you want to start a new scan if you want to start a new scan.
 This task will be sent to block-range anyway.
 */`);
  } else {
    const { error } = await scanner.createScanNodes(scanKey, lowEdge, highEdge);
    if (error) {
      log(error.message);
    } else {
      log(
        `Created a block range (${lowEdge.toString()}-${highEdge.toString()}) scan entry in the database with the selected key "${scanKey}".`
      );
    }
  }

  return { startBlock: lowEdge, endBlock: highEdge, mode, scanKey };
};
