import { Mode } from './../../common/common.enums';
import { BroadcastTcpClient } from '@alien-worlds/broadcast';
import { MongoSource } from '@alien-worlds/storage-mongodb';
import { AbisCreator } from '../../common';
import { bootstrap } from '../start-bootstrap';
import { NoAbisError } from '../bootstrap.errors';
import { InternalBroadcastMessageName } from '../../broadcast/internal-broadcast.enums';
import { ReaderBroadcastMessage } from '../../broadcast/messages';
import { BlockRangeScannerCreator } from '../../common/block-range-scanner/__dependencies__/block-range-scanner.creator';

jest.mock('../../common', () => ({
  Abis: {
    create: jest
      .fn()
      .mockResolvedValue({ fetchAbis: jest.fn().mockResolvedValue([1, 2, 3]) }),
  },
  BlockState: { create: jest.fn().mockResolvedValue({}) },
  ContractReader: { create: jest.fn().mockResolvedValue({ readContracts: jest.fn() }) },
  BlockRangeScanner: { create: jest.fn().mockResolvedValue({}) },
}));

jest.mock('@alien-worlds/broadcast', () => {
  return {
    BroadcastTcpClient: jest.fn().mockImplementation(() => {
      return {
        onMessage: jest.fn(),
        sendMessage: jest.fn(),
        connect: jest.fn(),
      };
    }),
  };
});

jest.mock('@alien-worlds/storage-mongodb', () => ({
  MongoSource: { create: jest.fn().mockResolvedValue({}) },
}));

jest.mock('../bootstrap.utils', () => ({
  createDefaultModeBlockRange: jest.fn().mockResolvedValue({}),
  createReplayModeBlockRange: jest.fn().mockResolvedValue({}),
  createTestModeBlockRange: jest.fn().mockResolvedValue({}),
}));

const featuredJson = {
  traces: [
    {
      shipTraceMessageName: ['transaction_trace_v0'],
      shipActionTraceMessageName: ['action_trace_v0', 'action_trace_v1'],
      contract: ['uspts.worlds'],
      action: ['addpoints'],
      processor: 'USPTS_WORLDS_ACTION_PROCESSOR',
    },
    {
      shipTraceMessageName: ['transaction_trace_v0'],
      shipActionTraceMessageName: ['action_trace_v0', 'action_trace_v1'],
      contract: ['notify.world'],
      action: ['logmine'],
      processor: 'NOTIFY_WORLD_ACTION_PROCESSOR',
    },
  ],
  deltas: [
    {
      shipDeltaMessageName: ['table_delta_v0'],
      name: ['contract_row'],
      code: ['msig.worlds'],
      scope: ['*'],
      table: ['*'],
      processor: 'MSIG_WORLDS_DELTA_PROCESSOR',
    },
  ],
};

const config = {
  mode: Mode.Default,
  broadcast: {},
  mongo: {},
  contractReader: {},
  abis: {},
  scanner: {},
  featured: featuredJson,
} as any;

const dependencies = {} as any;

describe('bootstrap', () => {
  let mockBroadcast;

  beforeEach(() => {
    mockBroadcast = new BroadcastTcpClient({});
  });

  it('throws an error when there are no abis', async () => {
    (AbisCreator.create as jest.Mock).mockResolvedValueOnce({
      fetchAbis: jest.fn().mockResolvedValue([]),
    });
    await expect(bootstrap(config, dependencies, featuredJson)).rejects.toThrow(
      NoAbisError
    );
  });

  it('runs without error in default mode', async () => {
    await bootstrap(config, dependencies, featuredJson);

    expect(BlockRangeScannerCreator.create).toHaveBeenCalled();
    expect(AbisCreator.create).toHaveBeenCalled();
    expect(MongoSource.create).toHaveBeenCalled();
    expect(BroadcastTcpClient).toHaveBeenCalled();
  });

  it.skip('handles DefaultModeReaderReady message correctly', async () => {
    await bootstrap(config, dependencies, featuredJson);
    const message = { name: InternalBroadcastMessageName.DefaultModeReaderReady };
    const messageHandler = mockBroadcast.onMessage.mock.calls[0][1];
    await messageHandler(message);

    // Replace the following expect lines with your actual testing assertions
    expect(mockBroadcast.sendMessage).toHaveBeenCalledWith(
      ReaderBroadcastMessage.newDefaultModeTask(expect.anything())
    );
  });

  it.skip('handles TestModeReaderReady message correctly', async () => {
    await bootstrap(config, dependencies, featuredJson);

    const message = { name: InternalBroadcastMessageName.DefaultModeReaderReady };

    const messageHandler = mockBroadcast.onMessage.mock.calls[0][1];
    await messageHandler(message);

    // Replace the following expect lines with your actual testing assertions
    expect(mockBroadcast.sendMessage).toHaveBeenCalledWith(
      ReaderBroadcastMessage.newDefaultModeTask(expect.anything())
    );
  });
});
