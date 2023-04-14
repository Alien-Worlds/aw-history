/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { SignedBlock } from '../signed-block';
const dto = {
  timestamp: '2022-06-30T12:28:32.900Z',
  producer: 'some_producer',
  confirmed: 0,
  previous: 'previous_value',
  transaction_mroot: 'mroot',
  action_mroot: 'action',
  schedule_version: 1,
  new_producers: '',
  header_extensions: [],
  producer_signature: 'prod',
  transactions: [
    {
      status: 0,
      cpu_usage_us: 1,
      net_usage_words: 1,
      trx: ['', ''],
    },
  ] as any,
};

describe('Block Unit tests', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2022, 4, 5));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('"create" should create Block entity based on given DTO', async () => {
    const entity = SignedBlock.create(dto);
    expect(entity).toBeInstanceOf(SignedBlock);
  });

  it('"create" should use system current timestamp if DTO does not have one', async () => {
    dto.timestamp = '';
    const entity = SignedBlock.create(dto);
    expect(entity.timestamp.toISOString()).toEqual('2022-05-04T22:00:00.000Z');
    expect(entity).toBeInstanceOf(SignedBlock);
  });
});
