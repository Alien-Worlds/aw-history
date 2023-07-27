/* eslint-disable @typescript-eslint/no-unused-vars */
import { ContractEncodedAbi } from '@alien-worlds/aw-core';

/**
 * A function that filters ABI entries based on the block number being greater than or equal to the start block.
 * @param startBlock - The start block number.
 * @param endBlock - The end block number.
 * @returns A filter function.
 */
const filterFromStartBlock =
  (startBlock: bigint, endBlock: bigint) => (abi: ContractEncodedAbi) =>
    abi.blockNumber >= startBlock;

/**
 * A function that filters ABI entries based on the block number being less than or equal to the end block.
 * @param startBlock - The start block number.
 * @param endBlock - The end block number.
 * @returns A filter function.
 */
const filterTillEndBlock =
  (startBlock: bigint, endBlock: bigint) => (abi: ContractEncodedAbi) =>
    abi.blockNumber <= endBlock;

/**
 * A function that filters ABI entries based on the block number being within the specified range.
 * @param startBlock - The start block number.
 * @param endBlock - The end block number.
 * @returns A filter function.
 */
const filterInRange =
  (startBlock: bigint, endBlock: bigint) => (abi: ContractEncodedAbi) =>
    abi.blockNumber >= startBlock && abi.blockNumber <= endBlock;

/**
 * Class representing the cache for storing and retrieving contract ABIs.
 */
export class AbisCache {
  private cache: Map<string, Set<ContractEncodedAbi>> = new Map();

  /**
   * Retrieves contract ABIs from the cache based on the specified options.
   * @param options - Options for retrieving the contract ABIs.
   * @param options.startBlock - The start block number to filter the ABIs.
   * @param options.endBlock - The end block number to filter the ABIs.
   * @param options.contracts - An array of contract addresses to filter the ABIs.
   * @returns An array of matching contract ABIs.
   */
  public getAbis(options: {
    startBlock?: bigint;
    endBlock?: bigint;
    contracts?: string[];
  }): ContractEncodedAbi[] {
    const { startBlock, endBlock, contracts } = options;

    const filter =
      startBlock && endBlock
        ? filterInRange
        : startBlock
        ? filterFromStartBlock
        : filterTillEndBlock;

    const abis = [];
    if (Array.isArray(contracts)) {
      for (const contract of contracts) {
        if (contract && this.cache.has(contract)) {
          const contractAbis = this.cache.get(contract);

          if (startBlock || endBlock) {
            const filtered = Array.from(contractAbis.values()).filter(
              filter(startBlock, endBlock)
            );

            abis.push(...filtered);
          } else {
            abis.push(...contractAbis.values());
          }
        }
      }

      return abis;
    }
    //
    this.cache.forEach(value => {
      if (startBlock || endBlock) {
        const filtered = Array.from(value.values()).filter(filter(startBlock, endBlock));
        abis.push(...filtered);
      } else {
        abis.push(...value.values());
      }
    });

    return abis;
  }

  /**
   * Retrieves the ABI for the specified block number and contract address.
   * @param blockNumber - The block number to find the ABI.
   * @param contract - The contract address.
   * @returns The matching ABI or null if not found.
   */
  public getAbi(blockNumber: bigint, contract: string): ContractEncodedAbi {
    if (this.cache.has(contract)) {
      const abis = this.cache.get(contract);
      const sorted = Array.from(abis.values()).sort((a, b) =>
        a.blockNumber > b.blockNumber ? -1 : 1
      );

      for (const abi of sorted) {
        if (abi.blockNumber <= blockNumber) {
          return abi;
        }
      }
    }

    return null;
  }

  /**
   * Inserts an array of ABIs into the cache.
   * @param abis - An array of ABIs to insert into the cache.
   */
  public insertAbis(abis: ContractEncodedAbi[]): void {
    abis.forEach(abi => {
      let set = this.cache.get(abi.contract);
      if (!set) {
        set = new Set();
        this.cache.set(abi.contract, set);
      }
      set.add(abi);
    });
  }
}
