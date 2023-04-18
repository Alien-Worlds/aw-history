import fetch from 'node-fetch';
import { parseToBigInt } from '@alien-worlds/api-core';
import { Api, JsonRpc } from 'eosjs';
import { GetInfoResult } from 'eosjs/dist/eosjs-rpc-interfaces';
import { BlockchainConfig } from './blockchain.types';

export class Blockchain {
  public static create(config: BlockchainConfig): Blockchain {
    const { endpoint, chainId } = config;
    const api = new Api({
      rpc: new JsonRpc(endpoint, { fetch }),
      chainId,
      signatureProvider: null,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    });

    return new Blockchain(endpoint, chainId, api);
  }

  private constructor(
    protected endpoint: string,
    protected chainId: string,
    protected api: Api
  ) {}

  public getInfo = async (): Promise<GetInfoResult> => {
    return this.api.rpc.get_info();
  };

  public async getHeadBlockNumber(): Promise<bigint> {
    const info = await this.api.rpc.get_info();
    const value = parseToBigInt(info.head_block_num);
    return value;
  }

  public async getLastIrreversibleBlockNumber(): Promise<bigint> {
    const info = await this.api.rpc.get_info();
    const value = parseToBigInt(info.last_irreversible_block_num);
    return value;
  }
}

//log(`Head block number: ${value.toString()}`);
//log(`Last irreversible block number: ${value.toString()}`);