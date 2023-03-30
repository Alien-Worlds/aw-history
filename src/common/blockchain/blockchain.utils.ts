import fetch from 'node-fetch';
import { log, parseToBigInt } from '@alien-worlds/api-core';
import { Api, JsonRpc } from 'eosjs';
import { GetInfoResult } from 'eosjs/dist/eosjs-rpc-interfaces';

export const fetchBlockchainInfo = async (
  endpoint: string,
  chainId: string
): Promise<GetInfoResult> => {
  const api = new Api({
    rpc: new JsonRpc(endpoint, { fetch }),
    chainId,
    signatureProvider: null,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  return api.rpc.get_info();
};

export const getLastIrreversibleBlockNumber = async (
  endpoint: string,
  chainId: string
): Promise<bigint> => {
  const info = await fetchBlockchainInfo(endpoint, chainId);
  const value = parseToBigInt(info.last_irreversible_block_num);
  log(`Last irreversible block number: ${value.toString()}`);
  return value;
};

export const getHeadBlockNumber = async (
  endpoint: string,
  chainId: string
): Promise<bigint> => {
  const info = await fetchBlockchainInfo(endpoint, chainId);
  const value = parseToBigInt(info.head_block_num);
  log(`Head block number: ${value.toString()}`);
  return value;
};
