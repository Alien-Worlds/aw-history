export type AuthSequenceJson = {
  account: string;
  sequence: string;
};

export type ReceiptJson = {
  receiver: string;
  act_digest: string;
  global_sequence: string;
  recv_sequence: string;
  auth_sequence: AuthSequenceJson[];
  code_sequence: number;
  abi_sequence: number;
};

export type ReceiptByNameDto = [string, ReceiptJson];

export type ActAuthJson = {
  actor: string;
  permission: string;
};

export type ActJson = {
  account: string;
  name: string;
  authorization: ActAuthJson;
  data: Uint8Array;
};

export type ActionTraceDto = {
  ship_message_name?: string;
  action_ordinal?: number;
  creator_action_ordinal?: number;
  receipt?: ReceiptByNameDto;
  receiver?: string;
  act?: ActJson;
  context_free?: boolean;
  elapsed?: string;
  console?: string;
  account_ram_deltas?: unknown[];
  except?: unknown;
  error_code?: string | number;
};

export type ActionTraceByNameDto = [string, ActionTraceDto];

export type ActionTraceModel = {
  shipTraceMessageName?: string;
  actionOrdinal?: number;
  creatorActionOrdinal?: number;
  receipt?: {
    shipMessageName?: string;
    receiver?: string;
    actDigest?: string;
    globalSequence?: bigint;
    recvSequence?: bigint;
    authSequence?: {
      account?: string;
      sequence?: string;
    }[];
    codeSequence?: number;
    abiSequence?: number;
  };
  receiver?: string;
  act?: {
    account?: string;
    name?: string;
    authorization?: {
      actor?: string;
      permission?: string;
    };
    data?: Uint8Array;
  };
  isContextFree?: boolean;
  elapsed?: string;
  console?: string;
  accountRamDeltas?: unknown[];
  except?: unknown;
  errorCode?: number;
};
