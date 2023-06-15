import { parseToBigInt } from '@alien-worlds/api-core';
import { ActAuthJson, ActJson, ActionTraceDto, ReceiptJson } from './action-trace.dtos';

/**
 * Represents the authorization information of an action.
 * @class
 */
export class ActAuth {
  /**
   * Creates an ActAuth instance based on the provided json.
   *
   * @param {ActAuthJson} json - The json containing the authorization information.
   * @returns {ActAuth} The created ActAuth instance.
   */
  public static create(json: ActAuthJson): ActAuth {
    const { actor, permission } = json;

    return new ActAuth(actor, permission);
  }

  /**
   * Creates an instance of ActAuth.
   *
   * @param {string} actor - The actor associated with the authorization.
   * @param {string} permission - The permission associated with the authorization.
   */
  constructor(public readonly actor: string, public readonly permission: string) {}
}

/**
 * Represents an action.
 * @class
 */
export class Act {
  /**
   * Creates an Act instance based on the provided json.
   *
   * @param {ActJson} json - The json containing the action information.
   * @returns {Act} The created Act instance.
   */
  public static create(json: ActJson): Act {
    const { account, name, data } = json;

    let authorization: ActAuth;

    if (json.authorization) {
      authorization = ActAuth.create(json.authorization);
    }

    return new Act(account, name, authorization, data);
  }

  /**
   * Creates an instance of Act.
   *
   * @param {string} account - The account associated with the action.
   * @param {string} name - The name of the action.
   * @param {ActAuth | undefined} authorization - The authorization information for the action.
   * @param {Uint8Array} data - The data associated with the action.
   */
  constructor(
    public readonly account: string,
    public readonly name: string,
    public readonly authorization: ActAuth,
    public readonly data: Uint8Array
  ) {}
}

/**
 * Represents the sequence information of an authorization.
 *
 * @typedef {Object} AuthSequence
 * @property {string} account - The account associated with the sequence.
 * @property {string} sequence - The sequence number.
 */
export type AuthSequence = {
  account: string;
  sequence: string;
};

/**
 * Represents the receipt information of an action.
 * @class
 */
export class Receipt {
  /**
   * Creates a Receipt instance based on the provided json.
   *
   * @param {string} shipMessageName - The name of the ship message.
   * @param {ReceiptJson} json - The json containing the receipt information.
   * @returns {Receipt} The created Receipt instance.
   */
  public static create(shipMessageName: string, json: ReceiptJson): Receipt {
    const {
      receiver,
      act_digest,
      global_sequence,
      recv_sequence,
      auth_sequence,
      code_sequence,
      abi_sequence,
    } = json;
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

  /**
   * Creates an instance of Receipt.
   *
   * @param {string} shipMessageName - The name of the ship message.
   * @param {string} receiver - The receiver of the action.
   * @param {string} actDigest - The digest of the action.
   * @param {bigint} globalSequence - The global sequence number.
   * @param {bigint} recvSequence - The receiver sequence number.
   * @param {AuthSequence[]} authSequence - The authorization sequence information.
   * @param {number} codeSequence - The code sequence number.
   * @param {number} abiSequence - The ABI sequence number.
   */
  constructor(
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

/**
 * Represents the trace information of an action.
 * @class
 */
export class ActionTrace {
  /**
   * Creates an ActionTrace instance based on the provided DTO.
   *
   * @param {string} shipMessageName - The name of the ship message.
   * @param {ActionTraceDto} dto - The DTO containing the action trace information.
   * @returns {ActionTrace} The created ActionTrace instance.
   */
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

  /**
   * Creates an instance of ActionTrace.
   *
   * @param {string} shipMessageName - The name of the ship message.
   * @param {number} actionOrdinal - The ordinal of the action.
   * @param {number} creatorActionOrdinal - The ordinal of the creator action.
   * @param {Receipt | null} receipt - The receipt information of the action.
   * @param {string} receiver - The receiver of the action.
   * @param {Act} act - The action object.
   * @param {boolean} isContextFree - Indicates whether the action is context-free.
   * @param {string} elapsed - The elapsed time of the action.
   * @param {string} console - The console output of the action.
   * @param {unknown[]} accountRamDeltas - The account RAM deltas.
   * @param {unknown} except - The exception information.
   * @param {number} errorCode - The error code.
   */
  constructor(
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
