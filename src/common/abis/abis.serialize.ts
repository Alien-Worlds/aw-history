/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Serialize } from 'eosjs';
import abieos from '@eosrio/node-abieos';
import { Authorization, hexToUint8Array } from 'eosjs/dist/eosjs-serialize';
import { Abi } from 'eosjs/dist/eosjs-rpc-interfaces';
import { AbiTable } from './abis.types';
import { log } from '@alien-worlds/api-core';

export type SerializeUtil = {
  deserializeAction: <T = unknown>(
    account: string,
    action: string,
    data: Uint8Array,
    hex: string
  ) => T;

  deserializeTable: <T = unknown>(
    account: string,
    table: string,
    data: Uint8Array,
    hex: string
  ) => T;
};

export class AbisSerialize {
  public static deserializeAction = <T = unknown>(
    account: string,
    action: string,
    data: Uint8Array,
    hex: string
  ): T => {
    try {
      if (process.platform === 'linux') {
        abieos.load_abi_hex(account, hex);
        const type = abieos.get_type_for_action(account, action);
        const json = abieos.bin_to_json(account, type, Buffer.from(data));
        return json as T;
      } else {
        const authorization: Authorization[] = [];
        const textEncoder = new TextEncoder();
        const textDecoder = new TextDecoder();
        const bytes = hexToUint8Array(hex);
        const abiTypes = Serialize.getTypesFromAbi(Serialize.createAbiTypes());
        const buffer = new Serialize.SerialBuffer({
          textEncoder,
          textDecoder,
          array: bytes,
        });
        buffer.restartRead();
        const abi: Abi = abiTypes.get('abi_def').deserialize(buffer);
        const types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi);
        const actions = new Map();
        for (const { name, type } of abi.actions) {
          actions.set(name, Serialize.getType(types, type));
        }
        const contract = { types, actions };
        const deserializedAction = Serialize.deserializeAction(
          contract,
          account,
          action,
          authorization,
          data,
          new TextEncoder(),
          new TextDecoder()
        );

        if(!deserializedAction.data) {
          log(`Serialized object is empty check the result of "Serialize.deserializeAction"`);
          log(deserializedAction);
        }

        return deserializedAction.data as T;
      }
    } catch (error) {
      log(error);
      return null;
    }
  };

  public static deserializeTable = <T = unknown>(
    account: string,
    table: string,
    data: Uint8Array,
    hex: string
  ): T => {
    try {
      if (process.platform === 'linux') {
        abieos.load_abi_hex(account, hex);
        const type = abieos.get_type_for_table(account, table);
        const json = abieos.bin_to_json(account, type, Buffer.from(data));
        return json as T;
      } else {
        const textEncoder = new TextEncoder();
        const textDecoder = new TextDecoder();
        const bytes = hexToUint8Array(hex);
        const abiTypes = Serialize.getTypesFromAbi(Serialize.createAbiTypes());
        const buffer = new Serialize.SerialBuffer({
          textEncoder,
          textDecoder,
          array: bytes,
        });
        buffer.restartRead();
        const abi: Abi = abiTypes.get('abi_def').deserialize(buffer);
        const types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi);
        const actions = new Map();
        for (const { name, type } of abi.actions) {
          actions.set(name, Serialize.getType(types, type));
        }
        const contract = { types, actions };

        let this_table: AbiTable, type: string;
        for (const t of abi.tables) {
          if (t.name === table) {
            this_table = t;
            break;
          }
        }

        if (this_table) {
          type = this_table.type;
        } else {
          return null;
        }

        const sb = new Serialize.SerialBuffer({ textEncoder, textDecoder, array: data });

        return contract.types.get(type).deserialize(sb) as T;
      }
    } catch (e) {
      return null;
    }
  };
}
