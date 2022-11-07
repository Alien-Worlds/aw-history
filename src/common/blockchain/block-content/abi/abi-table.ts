import { AbiTableDto } from './abi.dtos';

/**
 * @class
 */
export class AbiTable {
  /**
   *
   * @param {string} name - The name of the table, determined during instantiation.
   * @param {string} type - The table's corresponding struct
   * @param {string} indexType - The type of primary index of this table
   * @param {string[]} keyNames - An array of key names, length must equal length of key_types member
   * @param {string[]} keyTypes - An array of key types that correspond to key names array member, length of array must equal length of key names array.
   */
  private constructor(
    public readonly name: string,
    public readonly type: string,
    public readonly indexType: string,
    public readonly keyNames: string[],
    public readonly keyTypes: string[]
  ) {}

  /**
   * @returns {AbiTableDto}
   */
  public toDto(): AbiTableDto {
    const { name, type, indexType, keyNames, keyTypes } = this;
    return {
      name,
      type,
      index_type: indexType,
      key_names: keyNames,
      key_types: keyTypes,
    };
  }

  /**
   * @static
   * @param {AbiTableDto} dto
   * @returns {AbiTable}
   */
  public static fromDto(dto: AbiTableDto): AbiTable {
    const { name, type, index_type, key_names, key_types } = dto;
    return new AbiTable(name, type, index_type, key_names, key_types);
  }
}
