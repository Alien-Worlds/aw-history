/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Serialize } from 'eosjs';
import { Authorization, hexToUint8Array } from 'eosjs/dist/eosjs-serialize';
import { Abi } from 'eosjs/dist/eosjs-rpc-interfaces';
import { log } from '@alien-worlds/api-core';
import { AbiTableJson } from '@alien-worlds/block-reader';
import { AbisSerializer } from './abis.serializer';

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

/**
 * Represents a class for deserializing EOS ABIs.
 * @template T
 */
export class AbisEosSerializer<T = unknown> implements AbisSerializer<T> {
  /**
   * Deserializes the action data for a specific account and action.
   *
   * @param {string} account - The account associated with the action.
   * @param {string} action - The action name.
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string} hex - The hexadecimal representation of the data.
   * @returns {T} The deserialized action data.
   */
  public deserializeAction(
    account: string,
    action: string,
    data: Uint8Array,
    hex: string
  ): T {
    try {
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

      if (!deserializedAction.data) {
        log(
          `Serialized object is empty check the result of "Serialize.deserializeAction"`
        );
        log(deserializedAction);
      }

      return deserializedAction.data as T;
    } catch (error) {
      log(error);
      return null;
    }
  }

  /**
   * Deserializes the table data for a specific account and table.
   *
   * @param {string} account - The account associated with the table.
   * @param {string} table - The table name.
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string} hex - The hexadecimal representation of the data.
   * @returns {T} The deserialized table data.
   */
  public deserializeTable(
    account: string,
    table: string,
    data: Uint8Array,
    hex: string
  ): T {
    try {
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

      let this_table: AbiTableJson, type: string;
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
    } catch (e) {
      return null;
    }
  }
}
