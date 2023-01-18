import { log } from '@alien-worlds/api-core';
import { ContractReaderConfig } from './contract-reader.config';
import { FetchContractResponse } from './contract-reader.dtos';
import { FeaturedContract } from './featured-contract';
import { FeaturedContractSource } from './featured-contract.source';

export abstract class ContractReader {
  public abstract getInitialBlockNumber(contract: string): Promise<bigint>;
  public abstract readContracts(contracts: string[]): Promise<FeaturedContract[]>;
}

export class ContractReaderService implements ContractReader {
  private cache: Map<string, FeaturedContract> = new Map();

  constructor(
    private source: FeaturedContractSource,
    private config: ContractReaderConfig
  ) {}

  private async fetchContract(account: string): Promise<FetchContractResponse> {
    try {
      const { url } = this.config;

      const res = await fetch(
        `${url}/v2/history/get_actions?account=eosio&act.name=setabi&act.authorization.actor=${account}&limit=1&sort=asc`
      );
      const json = await res.json();

      const block_num = json.actions[0].block_num;
      return { account, block_num };
    } catch (error) {
      log(`An error occurred while retrieving contract data. ${error.message}`);
      return null;
    }
  }

  public async getInitialBlockNumber(contract: string): Promise<bigint> {
    try {
      const list = await this.readContracts([contract]);
      return list[0].initialBlockNumber;
    } catch (error) {
      return -1n;
    }
  }

  public async readContracts(contracts: string[]): Promise<FeaturedContract[]> {
    const list: FeaturedContract[] = [];
    for (const contract of contracts) {
      let entity: FeaturedContract;
      if (this.cache.has(contract)) {
        list.push(this.cache.get(contract));
      } else {
        const document = await this.source.findOne({ filter: { account: contract } });

        if (document) {
          entity = FeaturedContract.fromDocument(document);
          this.cache.set(entity.account, entity);
          list.push(entity);
        } else {
          const resp = await this.fetchContract(contract);
          if (resp) {
            entity = FeaturedContract.create(resp.account, resp.block_num);
            this.cache.set(entity.account, entity);
            this.source.insert(entity.toDocument());
            list.push(entity);
          }
        }
      }
    }

    return list;
  }
}
