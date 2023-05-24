import { MongoDB, parseToBigInt } from '@alien-worlds/api-core';
import { ContractEncodedAbiDocument, ContractEncodedAbiJson } from './abis.types';

export class ContractEncodedAbi {
  public static fromDocument(document: ContractEncodedAbiDocument): ContractEncodedAbi {
    const { block_number, contract, hex } = document;
    return new ContractEncodedAbi(parseToBigInt(block_number), contract, hex);
  }

  public static create(
    blockNumber: unknown,
    contract: string,
    hex: string
  ): ContractEncodedAbi {
    return new ContractEncodedAbi(parseToBigInt(blockNumber), contract, hex);
  }

  private constructor(
    public readonly blockNumber: bigint,
    public readonly contract: string,
    public readonly hex: string
  ) {}

  public toDocument(): ContractEncodedAbiDocument {
    const { blockNumber, hex, contract } = this;

    return {
      block_number: MongoDB.Long.fromBigInt(blockNumber),
      hex,
      contract,
    };
  }

  public toJson(): ContractEncodedAbiJson {
    const { blockNumber, hex, contract } = this;

    return {
      blockNumber,
      hex,
      contract,
    };
  }
}
