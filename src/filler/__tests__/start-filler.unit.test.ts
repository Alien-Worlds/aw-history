/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getLastIrreversibleBlockNumber } from "../../common/blockchain/blockchain.utils";
import { Mode } from "../../common/common.enums";
import { UnknownModeError } from "../../common/common.errors";
import { prepareDefaultModeInput, prepareReplayModeInput, prepareTestModeInput, startFiller } from "../start-filler";

jest.mock('../../common/blockchain/blockchain.utils');
jest.mock('../../block-range/block-range.broadcast', jest.fn(
  () => ({setupBlockRangeBroadcast: () => broadcastMock})
));
jest.mock('../../common/block-range-scanner/block-range-scanner.utils');
jest.mock('../../common/block-state/block-state.utils');

const config = {
  startBlock: 0n,
  endBlock: 1n,
  mode: Mode.Default,
  scanner: { scanKey: 'test' },
  blockchain: { chainId: '', endpoint: '' },
};

const broadcastMock = {
  onBlockRangeReadyMessage: jest.fn(),
  sendMessage: jest.fn(),
}

const blockStateMock = {
  getCurrentBlockNumber: jest.fn(),
}

const scannerMock = {
  hasUnscannedBlocks: jest.fn(),
  createScanNodes: jest.fn(),
}

describe('StartFiller Unit tests', () => {
  it('"prepareDefaultModeInput" should ', async () => {
    let input;
    input = await prepareDefaultModeInput(blockStateMock as any, config as any);

    expect(input.toJson()).toEqual({
      startBlock: 0n,
      endBlock: 1n,
      mode: Mode.Default,
      scanKey: 'test',
    });

    blockStateMock.getCurrentBlockNumber.mockResolvedValue(100n)
    input = await prepareDefaultModeInput(blockStateMock as any, { mode: Mode.Default,
      scanner: { scanKey: 'test' },
      blockchain: { chainId: '', endpoint: '' }} as any);

    expect(input.toJson()).toEqual({
      startBlock: 100n,
      endBlock: 4294967295n,
      mode: Mode.Default,
      scanKey: 'test',
    });
  });
  
  it('"prepareTestModeInput" should ', async () => {
    let input;

    input = await prepareTestModeInput(config as any);

    expect(input.toJson()).toEqual({
      startBlock: 0n,
      endBlock: 1n,
      mode: Mode.Default,
      scanKey: 'test',
    });

    input = await prepareTestModeInput({ mode: Mode.Default,
      startBlock: 5n,
      scanner: { scanKey: 'test' },
      blockchain: { chainId: '', endpoint: '' }} as any);

    expect(input.toJson()).toEqual({
      startBlock: 5n,
      endBlock: 6n,
      mode: Mode.Default,
      scanKey: 'test',
    });

    (getLastIrreversibleBlockNumber as jest.Mock).mockImplementation(() => 100n);
    input = await prepareTestModeInput({
      startBlock: 5n,
      mode: Mode.Default,
      scanner: { scanKey: 'test' },
      blockchain: { chainId: '', endpoint: '' }} as any);

      expect(input.toJson()).toEqual({
        startBlock: 5n,
        endBlock: 6n,
        mode: Mode.Default,
        scanKey: 'test',
      });

  });
  
  it('"prepareReplayModeInput" should ', async () => {
    let input;

    scannerMock.hasUnscannedBlocks.mockResolvedValue(true);
    input = await prepareReplayModeInput(scannerMock as any, config as any);

    expect(input).toEqual({
        startBlock: 0n,
        endBlock: 1n,
        mode: Mode.Default,
        scanKey: 'test',
    });

    scannerMock.hasUnscannedBlocks.mockResolvedValue(false);
    scannerMock.createScanNodes.mockResolvedValue({});
    (getLastIrreversibleBlockNumber as jest.Mock).mockImplementation(() => 100n);
    input = await prepareReplayModeInput(scannerMock as any, {...config, startBlock: null, endBlock: 200n} as any);

    expect(scannerMock.createScanNodes).toBeCalled();
    expect(input).toEqual({
        startBlock: 100n,
        endBlock: 200n,
        mode: Mode.Default,
        scanKey: 'test',
    });
  });


  it('"startFiller" should ', async () => {

    await startFiller({...config, mode: Mode.Default} as any);
    expect(broadcastMock.onBlockRangeReadyMessage).toBeCalled();

    await startFiller({...config, mode: Mode.Replay} as any);
    expect(broadcastMock.onBlockRangeReadyMessage).toBeCalled();

    await startFiller({...config, mode: Mode.Test} as any);
    expect(broadcastMock.onBlockRangeReadyMessage).toBeCalled();

    try {
      await startFiller({...config, mode: 'Foo'} as any);
    } catch (error) {
      expect(error).toBeInstanceOf(UnknownModeError);
    }
  });
});
