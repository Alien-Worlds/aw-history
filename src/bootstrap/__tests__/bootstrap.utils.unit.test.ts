import { Result } from '@alien-worlds/api-core';
import {
  createDefaultModeBlockRange,
  createReplayModeBlockRange,
  createTestModeBlockRange,
} from '../bootstrap.utils';
import { Mode } from '../../common';
import { EndBlockOutOfRangeError, StartBlockHigherThanEndBlockError, UndefinedStartBlockError } from '../bootstrap.errors';


describe('createDefaultModeBlockRange', () => {
  const originalLog = console.log;
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // mock console.log to prevent log outputs during tests
  });

  afterEach(() => {
    console.log = originalLog; // restore original console.log after tests
  });

  it('should create a block range in default mode with positive startBlock', async () => {
    const blockState = {
      getBlockNumber: jest.fn().mockResolvedValue({ content: 0n }),
    } as any;
    const blockchain = {
      getLastIrreversibleBlockNumber: jest
        .fn()
        .mockResolvedValue(Result.withContent(100n)),
      getHeadBlockNumber: jest.fn().mockResolvedValue(Result.withContent(100n)),
    } as any;
    const config = {
      blockchain: {},
      startBlock: 5n,
      endBlock: 5n,
      mode: Mode.Default,
      scanner: { scanKey: 'scanKey' },
      startFromHead: true,
      maxBlockNumber: 10n,
    } as any;

    const result = await createDefaultModeBlockRange(blockState, blockchain, config);

    expect(result).toEqual({
      startBlock: 5n,
      endBlock: 5n,
      mode: Mode.Default,
      scanKey: 'scanKey',
    });
  });

  it('should throw error when highEdge < lowEdge', async () => {
    const blockState = {
      getBlockNumber: jest.fn().mockResolvedValue({ content: 0n }),
    } as any;
    const blockchain = {
      getLastIrreversibleBlockNumber: jest
        .fn()
        .mockResolvedValue(Result.withContent(100n)),
      getHeadBlockNumber: jest.fn().mockResolvedValue(Result.withContent(100n)),
    } as any;
    const config = {
      blockchain: {},
      startBlock: 5n,
      endBlock: 3n,
      mode: Mode.Default,
      scanner: { scanKey: 'scanKey' },
      startFromHead: true,
      maxBlockNumber: 10n,
    } as any;

    await expect(
      createDefaultModeBlockRange(blockState, blockchain, config)
    ).rejects.toThrow(StartBlockHigherThanEndBlockError);
  });
});

describe('createTestModeBlockRange', () => {
  const originalLog = console.log;
  const blockchain = {
    getLastIrreversibleBlockNumber: jest.fn().mockResolvedValue(Result.withContent(100n)),
    getHeadBlockNumber: jest.fn().mockResolvedValue(Result.withContent(100n)),
  } as any;
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it('should create a block range in test mode when startBlock is not a bigint', async () => {
    const config = {
      blockchain: {},
      startBlock: null,
      mode: Mode.Test,
      scanner: { scanKey: 'scanKey' },
      startFromHead: true,
    } as any;

    const result = await createTestModeBlockRange(blockchain, config);

    expect(result).toEqual({
      startBlock: 99n,
      endBlock: 100n,
      mode: Mode.Test,
      scanKey: 'scanKey',
    });
  });

  it('should create a block range in test mode when startBlock is a bigint', async () => {
    const config = {
      blockchain: {},
      startBlock: 50n,
      mode: Mode.Test,
      scanner: { scanKey: 'scanKey' },
      startFromHead: true,
    } as any;

    const result = await createTestModeBlockRange(blockchain, config);

    expect(result).toEqual({
      startBlock: 50n,
      endBlock: 51n,
      mode: Mode.Test,
      scanKey: 'scanKey',
    });
  });
});

describe('createReplayModeBlockRange', () => {
  const originalLog = console.log;
  const blockchain = {
    getLastIrreversibleBlockNumber: jest.fn().mockResolvedValue(Result.withContent(100n)),
    getHeadBlockNumber: jest.fn().mockResolvedValue(Result.withContent(100n)),
  } as any;
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // mock console.log to prevent log outputs during tests
  });

  afterEach(() => {
    console.log = originalLog; // restore original console.log after tests
  });

  it('should throw an error when startBlock is not defined', async () => {
    const scanner = { hasUnscannedBlocks: jest.fn().mockResolvedValue(false) } as any;
    const config = {
      blockchain: {},
      startBlock: null,
      endBlock: null,
      mode: Mode.Replay,
      scanner: { scanKey: 'scanKey' },
    } as any;

    await expect(createReplayModeBlockRange(scanner, blockchain, config)).rejects.toThrow(
      UndefinedStartBlockError
    );
  });

  it('should throw an error when endBlock > lastIrreversibleBlock', async () => {
    const scanner = { hasUnscannedBlocks: jest.fn().mockResolvedValue(false) } as any;
    const config = {
      blockchain: {},
      startBlock: 50n,
      endBlock: 101n,
      mode: Mode.Replay,
      scanner: { scanKey: 'scanKey' },
    } as any;

    await expect(createReplayModeBlockRange(scanner, blockchain, config)).rejects.toThrow(
      EndBlockOutOfRangeError
    );
  });

  it('should throw an error when startBlock > endBlock', async () => {
    const scanner = { hasUnscannedBlocks: jest.fn().mockResolvedValue(false) } as any;
    const config = {
      blockchain: {},
      startBlock: 50n,
      endBlock: 49n,
      mode: Mode.Replay,
      scanner: { scanKey: 'scanKey' },
    } as any;

    await expect(createReplayModeBlockRange(scanner, blockchain, config)).rejects.toThrow(
      StartBlockHigherThanEndBlockError
    );
  });
});
