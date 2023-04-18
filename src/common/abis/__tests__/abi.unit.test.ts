/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Long } from 'mongodb';
import { ContractEncodedAbi } from '../contract-encoded-abi';

const document = {
  block_number: Long.fromBigInt(100n),
  contract: 'foo',
  hex: 'foo_hex',
};

describe('Abi Unit tests', () => {
  it('"create" should create Abi instance', async () => {
    const abi = ContractEncodedAbi.create(100, 'foo', 'foo_hex');
    expect(abi).toBeInstanceOf(ContractEncodedAbi);
  });

  it('"fromDocument" should create Abi instance based on docuemnt data', async () => {
    const abi = ContractEncodedAbi.fromDocument({
      block_number: Long.fromBigInt(100n),
      contract: 'foo',
      hex: 'foo_hex',
    });
    expect(abi).toBeInstanceOf(ContractEncodedAbi);
    expect(abi.blockNumber).toEqual(100n);
    expect(abi.contract).toEqual('foo');
    expect(abi.hex).toEqual('foo_hex');
  });

  it('"toJson" should return Abi JSON object', async () => {
    const abi = ContractEncodedAbi.create(100, 'foo', 'foo_hex');
    expect(abi.toJson()).toEqual({
      blockNumber: 100n,
      contract: 'foo',
      hex: 'foo_hex',
    });
  });

  it('"toDocument" should return mongo document based on Abi data', async () => {
    const abi = ContractEncodedAbi.create(100, 'foo', 'foo_hex');
    expect(abi.toDocument()).toEqual({
      block_number: Long.fromBigInt(100n),
      contract: 'foo',
      hex: 'foo_hex',
    });
  });
});
