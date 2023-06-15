import { parseToBigInt } from '@alien-worlds/api-core';
import { ContractEncodedAbiDocument, ContractEncodedAbiJson } from './abis.types';
import { MongoDB } from '@alien-worlds/storage-mongodb';

/**
 * Represents an encoded ABI (Application Binary Interface) for a contract.
 */
export class ContractEncodedAbi {
  /**
   * Creates a ContractEncodedAbi instance from a document.
   *
   * @param {ContractEncodedAbiDocument} document - The document containing the encoded ABI data.
   * @returns {ContractEncodedAbi} A new ContractEncodedAbi instance.
   */
  public static fromDocument(document: ContractEncodedAbiDocument): ContractEncodedAbi {
    const { block_number, contract, hex } = document;
    return new ContractEncodedAbi(parseToBigInt(block_number), contract, hex);
  }

  /**
   * Creates a ContractEncodedAbi instance with the specified block number, contract address, and hex code.
   *
   * @param {unknown} blockNumber - The block number.
   * @param {string} contract - The contract address.
   * @param {string} hex - The hex code representing the ABI.
   * @returns {ContractEncodedAbi} A new ContractEncodedAbi instance.
   */
  public static create(
    blockNumber: unknown,
    contract: string,
    hex: string
  ): ContractEncodedAbi {
    return new ContractEncodedAbi(parseToBigInt(blockNumber), contract, hex);
  }

  /**
   * Constructs a new instance of the ContractEncodedAbi class.
   *
   * @param {bigint} blockNumber - The block number.
   * @param {string} contract - The contract address.
   * @param {string} hex - The hex code representing the ABI.
   */
  constructor(
    public readonly blockNumber: bigint,
    public readonly contract: string,
    public readonly hex: string
  ) {}

  /**
   * Converts the ContractEncodedAbi instance to a document format.
   *
   * @returns {ContractEncodedAbiDocument} The ContractEncodedAbi instance as a document.
   */
  public toDocument(): ContractEncodedAbiDocument {
    const { blockNumber, hex, contract } = this;

    return {
      block_number: MongoDB.Long.fromBigInt(blockNumber),
      hex,
      contract,
    };
  }

  /**
   * Converts the ContractEncodedAbi instance to a JSON format.
   *
   * @returns {ContractEncodedAbiJson} The ContractEncodedAbi instance as JSON.
   */
  public toJson(): ContractEncodedAbiJson {
    const { blockNumber, hex, contract } = this;

    return {
      blockNumber,
      hex,
      contract,
    };
  }
}
