import { TransactionDto } from '../transaction/transaction.dtos';

export type SignedBlockJson = {
  timestamp: string;
  producer: string;
  confirmed: number;
  previous: string;
  transaction_mroot: string;
  action_mroot: string;
  schedule_version: number;
  new_producers: unknown;
  header_extensions: unknown[];
  producer_signature: string;
  transactions: TransactionDto[];
};
