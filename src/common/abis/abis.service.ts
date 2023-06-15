/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AbisServiceConfig } from './abis.types';
import fetch from 'node-fetch';
import { ContractEncodedAbi } from './contract-encoded-abi';

/**
 * Represents a service for fetching ABIs (Application Binary Interfaces).
 */
export class AbisService {
  /**
   * Constructs a new instance of the AbisService class.
   *
   * @param {AbisServiceConfig} config - The configuration for the AbisService.
   */
  constructor(private config: AbisServiceConfig) {}

  /**
   * Fetches the ABIs for a specific contract.
   *
   * @param {string} contract - The contract address.
   * @returns {Promise<ContractEncodedAbi[]>} A promise that resolves to an array of ContractEncodedAbi objects representing the fetched ABIs.
   */
  public async fetchAbis(contract: string): Promise<ContractEncodedAbi[]> {
    try {
      const list: ContractEncodedAbi[] = [];
      const { url, limit, filter } = this.config;

      const res = await fetch(
        `${url}/v2/history/get_actions?account=${contract}&filter=${
          filter || 'eosio:setabi'
        }&limit=${limit || 100}&sort=-1`
      );
      const json = await res.json();
      for (let i = 0; i < json.actions.length; i++) {
        const act = json.actions[i];
        list.push(
          ContractEncodedAbi.create(act.block_num, contract, String(act.act.data.abi))
        );
      }
      return list;
    } catch (error) {
      return [];
    }
  }
}
