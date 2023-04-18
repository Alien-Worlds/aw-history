/* eslint-disable @typescript-eslint/no-unused-vars */
import { ContractEncodedAbi } from './contract-encoded-abi';

const filterFromStartBlock =
  (startBlock: bigint, endBlock: bigint) => (abi: ContractEncodedAbi) =>
    abi.blockNumber >= startBlock;

const filterTillEndBlock =
  (startBlock: bigint, endBlock: bigint) => (abi: ContractEncodedAbi) =>
    abi.blockNumber <= endBlock;

const filterInRange =
  (startBlock: bigint, endBlock: bigint) => (abi: ContractEncodedAbi) =>
    abi.blockNumber >= startBlock && abi.blockNumber <= endBlock;

export class AbisCache {
  private cache: Map<string, Set<ContractEncodedAbi>> = new Map();

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
