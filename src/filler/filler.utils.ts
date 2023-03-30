import { log, parseToBigInt } from '@alien-worlds/api-core';
import { BlockRangeScanner } from '../common/block-range-scanner';
import { BlockState } from '../common/block-state';
import { fetchBlockchainInfo, getHeadBlockNumber, getLastIrreversibleBlockNumber } from '../common/blockchain';
import { Mode } from '../common/common.enums';
import { UnknownModeError } from '../common/common.errors';
import { BlockRangeTaskData } from '../common/common.types';
import { FillerConfig } from './filler.config';
import {
  StartBlockHigherThanEndBlockError,
  UndefinedStartBlockError,
  EndBlockOutOfRangeError,
} from './filler.errors';

export const createBlockRangeTaskInput = (
  blockState: BlockState,
  scanner: BlockRangeScanner,
  config: FillerConfig
) => {
  const { mode } = config;
  if (mode === Mode.Default) {
    return prepareDefaultModeInput(blockState, config);
  } else if (mode === Mode.Replay) {
    //
    return prepareReplayModeInput(scanner, config);
  } else if (mode === Mode.Test) {
    //
    return prepareTestModeInput(config);
  } else {
    //
    throw new UnknownModeError(mode);
  }
};

/**
 *
 * @param {Broadcast} broadcast
 * @param {FillerConfig} config
 */
export const prepareDefaultModeInput = async (
  blockState: BlockState,
  config: FillerConfig
): Promise<BlockRangeTaskData> => {
  const {
    startBlock,
    endBlock,
    mode,
    scanner: { scanKey },
    blockchain: { chainId, endpoint },
    startFromHead,
  } = config;
  const blockchainInfo = await fetchBlockchainInfo(endpoint, chainId);
  const lastIrreversibleBlock = parseToBigInt(blockchainInfo.last_irreversible_block_num);
  const headBlock = parseToBigInt(blockchainInfo.head_block_num);
  const currentBlockNumber = await blockState.getBlockNumber();

  let highEdge: bigint;
  let lowEdge: bigint;

  if (typeof startBlock !== 'bigint' && currentBlockNumber > 0n) {
    lowEdge = currentBlockNumber;
    log(`  Using current state block number ${lowEdge.toString()}`);
  } else if (typeof startBlock !== 'bigint' && currentBlockNumber < 0n) {
    if (startFromHead) {
      lowEdge = headBlock;
      log(`  Using head block number ${lowEdge.toString()}`);
    } else {
      lowEdge = lastIrreversibleBlock;
      log(`  Using last irreversable block number ${lowEdge.toString()}`);
    }
  } else if (startBlock < 0n) {
    if (startFromHead) {
      lowEdge = headBlock + startBlock;
      log(`  Using offset (${startBlock.toString()}) from the head block number`);
    } else {
      lowEdge = lastIrreversibleBlock + startBlock;
      log(
        `  Using offset (${startBlock.toString()}) from the last irreversable block number`
      );
    }
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

  return { startBlock: lowEdge, endBlock: highEdge, mode, scanKey };
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
    startFromHead,
  } = config;

  const blockchainInfo = await fetchBlockchainInfo(endpoint, chainId);
  const lastIrreversibleBlock = parseToBigInt(blockchainInfo.last_irreversible_block_num);
  const headBlock = parseToBigInt(blockchainInfo.head_block_num);

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
