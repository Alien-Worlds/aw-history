import { Long, parseToBigInt } from '@alien-worlds/api-core';
import { AbiDocument, AbiJson } from './abis.types';

export class Abi {
  public static fromDocument(document: AbiDocument): Abi {
    const { block_number, contract, hex } = document;
    return new Abi(parseToBigInt(block_number), contract, hex);
  }

  public static create(blockNumber: unknown, contract: string, hex: string): Abi {
    return new Abi(parseToBigInt(blockNumber), contract, hex);
  }

  private constructor(
    public readonly blockNumber: bigint,
    public readonly contract: string,
    public readonly hex: string
  ) {}

  public toDocument(): AbiDocument {
    const { blockNumber, hex, contract } = this;

    return {
      block_number: Long.fromBigInt(blockNumber),
      hex,
      contract,
    };
  }

  public toJson(): AbiJson {
    const { blockNumber, hex, contract } = this;

    return {
      blockNumber,
      hex,
      contract,
    };
  }
}
