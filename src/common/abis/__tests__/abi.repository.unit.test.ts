/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Long } from 'mongodb';
import { ContractEncodedAbi } from '../contract-encoded-abi';

const document = {
  block_number: Long.fromBigInt(100n),
  contract: 'foo',
  hex: 'foo_hex',
};

describe('Abi Repository Unit tests', () => {
  it('"create" should create Abi instance', async () => {
    const abi = ContractEncodedAbi.create(100, 'foo', 'foo_hex');
    expect(abi).toBeInstanceOf(ContractEncodedAbi);
  });
});
