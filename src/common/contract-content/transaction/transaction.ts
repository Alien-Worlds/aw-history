/* eslint-disable @typescript-eslint/no-empty-function */

import { PackedTrxJson, TransactionJson } from './transaction.dtos';

/**
 * Represents a packed transaction.
 * @class
 */
export class PackedTrx {
  /**
   * Creates a PackedTrx instance.
   *
   * @param {string} type - The type of the packed transaction.
   * @param {PackedTrxJson} json - The DTO containing the packed transaction information.
   * @returns {PackedTrx} The created PackedTrx instance.
   */
  public static create(type: string, json: PackedTrxJson): PackedTrx {
    const { signatures, compression, packed_context_free_data, packed_trx } = json;
    return new PackedTrx(
      type,
      signatures,
      compression,
      packed_context_free_data,
      packed_trx
    );
  }

  /**
   * Creates an instance of PackedTrx.
   *
   * @param {string} type - The type of the packed transaction.
   * @param {string[]} signatures - The signatures of the packed transaction.
   * @param {number} compression - The compression type of the packed transaction.
   * @param {unknown} packedContextFreeData - The packed context-free data of the packed transaction.
   * @param {unknown} content - The content of the packed transaction.
   */
  constructor(
    public readonly type: string,
    public readonly signatures: string[],
    public readonly compression: number,
    public readonly packedContextFreeData: unknown,
    public readonly content: unknown //TODO: we should deserialize "packed_trx"
  ) {}
}

export class Trx {
  public static create(type: string, dto: string): Trx {
    return new Trx(type, dto);
  }

  private constructor(public readonly type: string, public readonly content: string) {}
}

/**
 * Represents a transaction.
 * @class
 */
export class Transaction {
  /**
   * Creates a Transaction instance.
   *
   * @param {TransactionJson} json - The DTO containing the transaction information.
   * @returns {Transaction} The created Transaction instance.
   */
  public static create(json: TransactionJson): Transaction {
    const { status, cpu_usage_us, net_usage_words } = json;

    const [type, content] = json.trx;
    let trx;

    switch (type) {
      case 'transaction_id': {
        trx = Trx.create(type, <string>content);
        break;
      }
      case 'packed_transaction': {
        trx = PackedTrx.create(type, <PackedTrxJson>content);
        break;
      }
      default: {
        console.warn(`Unknown trx type "${type}"`);
      }
    }
    return new Transaction(status, cpu_usage_us, net_usage_words, trx);
  }

  /**
   * Creates an instance of Transaction.
   *
   * @param {number} status - The status of the transaction.
   * @param {number} cpuUsageUs - The CPU usage in microseconds of the transaction.
   * @param {number} netUsageWords - The net usage words of the transaction.
   * @param {Trx | PackedTrx | unknown} trx - The transaction object.
   */
  constructor(
    public readonly status: number,
    public readonly cpuUsageUs: number,
    public readonly netUsageWords: number,
    public readonly trx: Trx | PackedTrx | unknown
  ) {}
}
