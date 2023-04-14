/* eslint-disable @typescript-eslint/no-unsafe-return */
import { getTypesFromAbi } from 'eosjs/dist/eosjs-serialize';

import { AbiJson } from './abi.dtos';
import { Serialize } from 'eosjs';
import { AbiType } from './abi-type';
import { AbiStruct } from './abi-struct';
import { AbiTable } from './abi-table';
import { AbiAction } from './abi-action';
import { RicardianClause } from './ricardian-clause';
import { AbiExtension } from './abi-extension';
import { AbiErrorMessage } from './abi-error-message';
import { AbiVariant } from './abi-variant';
import { deserialize, serialize } from 'v8';

/**
 * ABI entity
 * @class
 */
export class Abi {
  private typesMap: Map<string, Serialize.Type>;
  /**
   *
   * @param {string} version
   * @param {AbiType[]} types
   * @param {AbiStruct[]} structs
   * @param {AbiAction[]} actions
   * @param {AbiTable[]} tables
   * @param {RicardianClause[]} ricardianClauses
   * @param {AbiExtension[]} abiExtensions
   * @param {AbiErrorMessage[]} errorMessages
   * @param {string} comment
   * @param {AbiVariant[]} variants
   */
  private constructor(
    public readonly version: string,
    public readonly types: AbiType[],
    public readonly structs: AbiStruct[],
    public readonly tables: AbiTable[],
    public readonly actions: AbiAction[],
    public readonly ricardianClauses: RicardianClause[],
    public readonly abiExtensions: AbiExtension[],
    public readonly errorMessages: AbiErrorMessage[],
    public readonly variants?: AbiVariant[]
  ) {
    this.typesMap = getTypesFromAbi(Serialize.createInitialTypes(), this.toJson());
  }

  /**
   * Parse ABI entity to DTO
   * @returns {AbiJson}
   */
  public toJson(): AbiJson {
    const {
      version,
      types,
      structs,
      actions,
      tables,
      ricardianClauses,
      abiExtensions,
      errorMessages: AbierrorMessages,
      variants,
    } = this;

    const dto: AbiJson = {
      version,
      types: types.map(item => item.toDto()),
      structs: structs.map(item => item.toDto()),
      tables: tables.map(item => item.toDto()),
      actions: actions ? actions.map(item => item.toDto()) : [],
      ricardian_clauses: ricardianClauses
        ? ricardianClauses.map(item => item.toDto())
        : [],
      abi_extensions: abiExtensions ? abiExtensions.map(item => item.toDto()) : [],
      error_messages: AbierrorMessages ? AbierrorMessages.map(item => item.toDto()) : [],
      variants: variants ? variants.map(item => item.toDto()) : [],
    };

    return dto;
  }

  public toBuffer(): Buffer {
    return serialize(this.toJson());
  }

  public toHex(): string {
    return serialize(this.toJson()).toString('hex');
  }

  public getTypesMap(): Map<string, Serialize.Type> {
    return this.typesMap;
  }

  /**
   * Create ABI entity based on provided DTO
   *
   * @static
   * @param {AbiJson} dto
   * @returns {Abi}
   */
  public static fromJson(dto: AbiJson): Abi {
    const { version, types, structs, tables } = dto;
    const actions = dto.actions ? dto.actions.map(dto => AbiAction.fromDto(dto)) : [];
    const ricardian_clauses = dto.ricardian_clauses
      ? dto.ricardian_clauses.map(dto => RicardianClause.fromDto(dto))
      : [];
    const abi_extensions = dto.abi_extensions
      ? dto.abi_extensions.map(dto => AbiExtension.fromDto(dto))
      : [];
    const error_messages = dto.error_messages
      ? dto.error_messages.map(dto => AbiErrorMessage.fromDto(dto))
      : [];
    const variants = dto.variants ? dto.variants.map(dto => AbiVariant.fromDto(dto)) : [];

    return new Abi(
      version,
      types.map(dto => AbiType.fromDto(dto)),
      structs.map(dto => AbiStruct.fromDto(dto)),
      tables.map(dto => AbiTable.fromDto(dto)),
      actions,
      ricardian_clauses,
      abi_extensions,
      error_messages,
      variants
    );
  }

  public static fromBuffer(buffer: Buffer): Abi {
    const json = deserialize(buffer);
    return Abi.fromJson(json);
  }

  public static fromHex(value: string): Abi {
    const buf = Buffer.from(value, 'hex');
    return Abi.fromBuffer(buf);
  }
}
