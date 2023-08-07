export type AuthSequence = {
  account: string;
  sequence: string;
};

export type Receipt = {
  receiver: string;
  act_digest: string;
  global_sequence: string;
  recv_sequence: string;
  auth_sequence: AuthSequence[];
  code_sequence: number;
  abi_sequence: number;
};

export type ReceiptByName = [string, Receipt];

export type ActAuth = {
  actor: string;
  permission: string;
};

export type Act = {
  account: string;
  name: string;
  authorization: ActAuth;
  data: Uint8Array;
};

export type ActionTrace = {
  ship_message_name?: string;
  action_ordinal?: number;
  creator_action_ordinal?: number;
  receipt?: ReceiptByName;
  receiver?: string;
  act?: Act;
  context_free?: boolean;
  elapsed?: string;
  console?: string;
  account_ram_deltas?: unknown[];
  except?: unknown;
  error_code?: string | number;
};

export type ActionTraceByName = [string, ActionTrace];
