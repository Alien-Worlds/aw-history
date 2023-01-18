import { log } from '@alien-worlds/api-core';
import { FeaturedConfig } from '../featured';
import { Abi } from './abi';
import { AbisServiceNotSetError } from './abis.errors';
import { AbisRepository } from './abis.repository';
import { AbisService } from './abis.service';

export class Abis {
  private contracts: Set<string> = new Set();
  constructor(
    private repository: AbisRepository,
    private service?: AbisService,
    featuredConfig?: FeaturedConfig
  ) {
    if (featuredConfig) {
      const { traces, deltas } = featuredConfig;

      traces.forEach(trace => {
        const { contract } = trace;
        contract.forEach(value => {
          this.contracts.add(value);
        });
      });

      deltas.forEach(delta => {
        const { code } = delta;
        // apply if it is not a "match" object { match: "", processor:"" }
        if (code) {
          code.forEach(value => {
            this.contracts.add(value);
          });
        }
      });
    }
  }

  public async getAbis(
    startBlock: bigint,
    endBlock: bigint,
    contract?: string,
    fetch?: boolean
  ): Promise<Abi[]> {
    let abis = await this.repository.getAbis(startBlock, endBlock, contract);

    if (abis.length === 0 && fetch) {
      log(
        `No contract ABIs (${startBlock}-${endBlock}) were found in the database. Trying to fetch ABIs...`
      );
      abis = await this.fetchAbis(contract);
    }

    return abis;
  }

  public async getAbi(
    blockNumber: bigint,
    contract: string,
    fetch = false
  ): Promise<Abi> {
    let abi = await this.repository.getAbi(blockNumber, contract);

    if (fetch && !abi) {
      const abis = await this.fetchAbis(contract);
      abi = abis.reduce((result, abi) => {
        if (abi.blockNumber <= blockNumber) {
          if (!result || result.blockNumber < abi.blockNumber) {
            result = abi;
          }
        }
        return result;
      }, null);
    }

    return abi;
  }

  public async storeAbi(
    blockNumber: unknown,
    contract: string,
    hex: string
  ): Promise<boolean> {
    return this.repository.insertAbi(Abi.create(blockNumber, contract, hex));
  }

  public async fetchAbis(contract?: string): Promise<Abi[]> {
    if (!this.service) {
      throw new AbisServiceNotSetError();
    }
    let abis: Abi[] = [];

    if (contract) {
      abis = await this.service.fetchAbis(contract);
    } else {
      const { contracts } = this;
      for (const contract of contracts) {
        const contractAbis = await this.service.fetchAbis(contract);
        abis.push(...contractAbis);
      }
    }

    if (abis.length > 0) {
      await this.repository.insertManyAbis(abis);
    }

    return abis;
  }
}
