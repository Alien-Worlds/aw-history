import { parseToBigInt } from '@alien-worlds/api-core';
import { Api, JsonRpc } from 'eosjs';
import fetch from 'node-fetch';

export const getLastIrreversibleBlockNumber = async (
  endpoint: string,
  chainId: string
): Promise<bigint> => {
  const api = new Api({
    rpc: new JsonRpc(endpoint, { fetch }),
    chainId,
    signatureProvider: null,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  const info = await api.rpc.get_info();
  return parseToBigInt(info.last_irreversible_block_num);
};
