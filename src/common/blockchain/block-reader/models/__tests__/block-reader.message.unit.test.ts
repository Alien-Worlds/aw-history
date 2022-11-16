/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ReceivedBlock } from '../received-block';
import { BlockReaderMessage } from '../block-reader.message';
import { deserializeMessage } from '../../block-reader.utils';

jest.mock('eosjs/dist/eosjs-serialize');
jest.mock(
  '../../block-reader.utils',
  jest.fn(() => ({
    deserializeMessage: jest.fn(() => ['get_status_result_v0', {}]),
  }))
);

describe('BlockReaderMessage Unit tests', () => {
  it('"create" should create BlockReaderMessage entity based on given DTO', async () => {
    ReceivedBlock.create = jest.fn().mockImplementation();

    const entity = BlockReaderMessage.create(Uint8Array.from([]), new Map());

    expect(entity).toBeInstanceOf(BlockReaderMessage);
    expect(deserializeMessage).toBeCalled();
  });

  it('"isGetStatusResult" should return true when type is "get_status_result_{version}"', async () => {
    ReceivedBlock.create = jest.fn().mockImplementation();

    const entity = BlockReaderMessage.create(Uint8Array.from([]), new Map());

    expect(entity.isGetStatusResult).toBeTruthy();
  });

  it('"isGetBlocksResult" should return true when type is "get_blocks_result_{version}"', async () => {
    ReceivedBlock.create = jest.fn().mockImplementation();

    const entity = BlockReaderMessage.create(Uint8Array.from([]), new Map());
    (entity as any).type = `get_blocks_result_${entity.version}`;

    expect(entity.isGetBlocksResult).toBeTruthy();
  });
});
