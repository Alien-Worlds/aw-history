import { FeaturedConfig } from '../featured';
import { Abi } from './abi';
import { AbisRepository } from './abis.repository';
import { AbisService } from './abis.service';

export class Abis {
  private contracts: Set<string> = new Set();
  constructor(
    private service: AbisService,
    private repository: AbisRepository,
    featuredConfig: FeaturedConfig
  ) {
    const { traces } = featuredConfig;

    traces.forEach(trace => {
      const { contract } = trace;
      contract.forEach(value => {
        this.contracts.add(value);
      });
    });
  }

  public async getAbis(
    startBlock: bigint,
    endBlock: bigint,
    contract?: string
  ): Promise<Abi[]> {
    return this.repository.getAbis(startBlock, endBlock, contract);
  }

  public async getAbi(blockNumber: bigint, contract: string): Promise<Abi> {
    return this.repository.getAbi(blockNumber, contract);
  }

  public async storeAbi(
    blockNumber: unknown,
    contract: string,
    hex: string
  ): Promise<boolean> {
    return this.repository.insertAbi(Abi.create(blockNumber, contract, hex));
  }

  public async fetchAbis(): Promise<void> {
    const { contracts } = this;
    const abis: Abi[] = [];

    for (const contract of contracts) {
      const contractAbis = await this.service.fetchAbis(contract);
      abis.push(...contractAbis);
    }

    await this.repository.insertManyAbis(abis);
  }
}
