/* eslint-disable @typescript-eslint/no-empty-function */

import { parseDateToMs } from '@alien-worlds/api-core';
import { Transaction } from '../transaction/transaction';
import { BlockDto } from './block.dtos';

export class Block {
  public static create(dto: BlockDto): Block {
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
    } = dto;

    const timestamp = dto.timestamp
      ? new Date(parseDateToMs(dto.timestamp.replace(/(\.000|\.500)/g, 'Z')))
      : new Date();

    return new Block(
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

  private constructor(
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
