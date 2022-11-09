export type DeltaMessageBufferData = {
  type: string;
  name: string;
  code: string;
  scope: string;
  table: string;
  payer: string;
  present: number;
  primaryKey: bigint;
  blockNumber: bigint;
  blockTimestamp: Date;
  data: Uint8Array;
  dataHash: string;
  label: string;
};

export type TraceMessageBufferData = {
  blockNumber: bigint;
  blockTimestamp: Date;
  transactionId: string;
  account: string;
  name: string;
  recvSequence: bigint;
  globalSequence: bigint;
  data: Uint8Array;
  label: string;
};
