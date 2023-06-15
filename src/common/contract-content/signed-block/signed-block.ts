/* eslint-disable @typescript-eslint/no-empty-function */

import { parseDateToMs } from '@alien-worlds/api-core';
import { Transaction } from '../transaction/transaction';
import { SignedBlockJson } from './signed-block.dtos';

/**
 * Represents a signed block.
 * @class
 */
export class SignedBlock {
  /**
   * Creates a SignedBlock instance based on the provided json.
   *
   * @param {SignedBlockJson} json - The json containing the signed block information.
   * @returns {SignedBlock} The created SignedBlock instance.
   */
  public static create(json: SignedBlockJson): SignedBlock {
    const {
      producer,
      confirmed,
      previous,
      transaction_mroot,
      action_mroot,
      schedule_version,
      new_producers,
      header_extensions,
      producer_signature,
      transactions,
    } = json;

    const timestamp = json.timestamp
      ? new Date(parseDateToMs(json.timestamp))
      : new Date();

    return new SignedBlock(
      timestamp,
      producer,
      confirmed,
      previous,
      transaction_mroot,
      action_mroot,
      schedule_version,
      new_producers,
      header_extensions,
      producer_signature,
      transactions.map(dto => Transaction.create(dto))
    );
  }

  /**
   * Creates an instance of SignedBlock.
   *
   * @param {Date} timestamp - The timestamp of the signed block.
   * @param {string} producer - The producer of the block.
   * @param {number} confirmed - The number of confirmed blocks.
   * @param {string} previous - The previous block ID.
   * @param {string} transactionMroot - The Merkle root of the transactions.
   * @param {string} actionMroot - The Merkle root of the actions.
   * @param {number} scheduleVersion - The schedule version of the block.
   * @param {unknown} newProducers - The new producers of the block.
   * @param {unknown[]} headerExtensions - The header extensions of the block.
   * @param {string} producerSignature - The producer signature of the block.
   * @param {Transaction[]} transactions - The transactions included in the block.
   */
  constructor(
    public readonly timestamp: Date,
    public readonly producer: string,
    public readonly confirmed: number,
    public readonly previous: string,
    public readonly transactionMroot: string,
    public readonly actionMroot: string,
    public readonly scheduleVersion: number,
    public readonly newProducers: unknown,
    public readonly headerExtensions: unknown[],
    public readonly producerSignature: string,
    public readonly transactions: Transaction[]
  ) {}
}
