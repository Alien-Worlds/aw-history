import { parseToBigInt } from '@alien-worlds/api-core';
import { ActAuthJson, ActJson, ActionTraceDto, ReceiptJson } from './action-trace.dtos';

export class ActAuth {
  public static create(dto: ActAuthJson): ActAuth {
    const { actor, permission } = dto;

    return new ActAuth(actor, permission);
  }
  private constructor(
    public readonly actor: string,
    public readonly permission: string
  ) {}
}

export class Act {
  public static create(dto: ActJson): Act {
    const { account, name, data } = dto;

    //parse DATA
    let authorization: ActAuth;

    if (dto.authorization) {
      authorization = ActAuth.create(dto.authorization);
    }

    return new Act(account, name, authorization, data);
  }
  private constructor(
    public readonly account: string,
    public readonly name: string,
    public readonly authorization: ActAuth,
    public readonly data: Uint8Array
  ) {}
}

export type AuthSequence = {
  account: string;
  sequence: string;
};

export class Receipt {
  public static create(shipMessageName: string, dto: ReceiptJson): Receipt {
    const {
      receiver,
      act_digest,
      global_sequence,
      recv_sequence,
      auth_sequence,
      code_sequence,
      abi_sequence,
    } = dto;
    return new Receipt(
      shipMessageName,
      receiver,
      act_digest,
      parseToBigInt(global_sequence),
      parseToBigInt(recv_sequence),
      auth_sequence,
      code_sequence,
      abi_sequence
    );
  }
  private constructor(
    public readonly shipMessageName: string,
    public readonly receiver: string,
    public readonly actDigest: string,
    public readonly globalSequence: bigint,
    public readonly recvSequence: bigint,
    public readonly authSequence: AuthSequence[],
    public readonly codeSequence: number,
    public readonly abiSequence: number
  ) {}
}

export class ActionTrace {
  public static create(shipMessageName: string, dto: ActionTraceDto): ActionTrace {
    const {
      action_ordinal,
      creator_action_ordinal,
      receiver,
      act,
      context_free,
      elapsed,
      console,
      account_ram_deltas,
      except,
      error_code,
    } = dto;

    let receipt: Receipt;
    if (dto.receipt && dto.receipt.length) {
      const [receiptType, receiptContent] = dto.receipt;
      receipt = Receipt.create(receiptType, receiptContent);
    }

    return new ActionTrace(
      shipMessageName,
      action_ordinal,
      creator_action_ordinal,
      receipt,
      receiver,
      Act.create(act),
      context_free,
      elapsed,
      console,
      account_ram_deltas,
      except,
      Number(error_code)
    );
  }

  private constructor(
    public readonly shipMessageName: string,
    public readonly actionOrdinal: number,
    public readonly creatorActionOrdinal: number,
    public readonly receipt: Receipt | null,
    public readonly receiver: string,
    public readonly act: Act,
    public readonly isContextFree: boolean,
    public readonly elapsed: string,
    public readonly console: string,
    public readonly accountRamDeltas: unknown[],
    public readonly except: unknown,
    public readonly errorCode: number
  ) {}
}