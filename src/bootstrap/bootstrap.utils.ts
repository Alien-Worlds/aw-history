import { log, parseToBigInt } from '@alien-worlds/api-core';
import { BlockRangeScanner } from '../common/block-range-scanner';
import { BlockState } from '../common/block-state';
import { fetchBlockchainInfo } from '../common/blockchain';
import { Mode } from '../common/common.enums';
import { UnknownModeError } from '../common/common.errors';
import { ReaderBroadcastMessageData } from '../internal-broadcast';
import { BootstrapConfig } from './bootstrap.types';
import {
  StartBlockHigherThanEndBlockError,
  UndefinedStartBlockError,
  EndBlockOutOfRangeError,
} from './bootstrap.errors';

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
): Promise<ReaderBroadcastMessageData> => {
  const {
    startBlock,
    endBlock,
    mode,
    scanner: { scanKey },
    blockchain: { chainId, endpoint },
    startFromHead,
    maxBlockNumber,
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
    highEdge = parseToBigInt(maxBlockNumber || 0xffffffff);
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
 * @param {BootstrapConfig} config
 */
export const createTestModeBlockRange = async (
  config: BootstrapConfig
): Promise<ReaderBroadcastMessageData> => {
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
 * @param {BootstrapConfig} config
 */
export const createReplayModeBlockRange = async (
  scanner: BlockRangeScanner,
  config: BootstrapConfig
): Promise<ReaderBroadcastMessageData> => {
  const {
    blockchain: { chainId, endpoint },
    scanner: { scanKey },
    startBlock,
    endBlock,
    mode,
  } = config;

  const lowEdge = startBlock;
  let highEdge = endBlock;

  const blockchainInfo = await fetchBlockchainInfo(endpoint, chainId);
  const lastIrreversibleBlock = parseToBigInt(blockchainInfo.last_irreversible_block_num);

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
