/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AbisServiceConfig } from './abis.types';
import fetch from 'node-fetch';
import { Abi } from './abi';

export class AbisService {
  constructor(private config: AbisServiceConfig) {}

  public async fetchAbis(contract: string): Promise<Abi[]> {
    try {
      const list: Abi[] = [];
      const { url, limit, filter } = this.config;

      const res = await fetch(
        `${url}?account=${contract}&filter=${filter || 'eosio:setabi'}&limit=${
          limit || 100
        }&sort=-1`
      );
      const json = await res.json();
      for (let i = 0; i < json.actions.length; i++) {
        const act = json.actions[i];
        list.push(Abi.create(act.block_num, contract, String(act.act.data.abi)));
      }
      return list;
    } catch (error) {
      return [];
    }
  }
}
