/* eslint-disable @typescript-eslint/unbound-method */
import { AbiStructJson, FieldJson } from './abi.dtos';

/**
 * @class
 */
export class StructField {
  /**
   *
   * @param {string} name - The field's name
   * @param {string} type - The field's type
   */
  private constructor(public readonly name: string, public readonly type: string) {}

  /**
   * @returns {FieldJson}
   */
  public toDto(): FieldJson {
    const { name, type } = this;
    return { name, type };
  }

  /**
   * @static
   * @param {FieldJson} dto
   * @returns {StructField}
   */
  public static fromDto(dto: FieldJson): StructField {
    const { name, type } = dto;
    return new StructField(name, type);
  }
}

/**
 * @class
 */
export class AbiStruct {
  /**
   *
   * @param {string} name
   * @param {string} base - Inheritance, parent struct
   * @param {StructField[]} fields - Array of field objects describing the struct's fields
   */
  private constructor(
    public readonly name: string,
    public readonly base: string,
    public readonly fields: StructField[]
  ) {}

  /**
   * @returns {AbiStructJson}
   */
  public toDto(): AbiStructJson {
    return {
      name: this.name,
      base: this.base,
      fields: this.fields.map(field => field.toDto()),
    };
  }

  /**
   * @static
   * @param {AbiStructJson} dto
   * @returns {AbiStruct}
   */
  public static fromDto(dto: AbiStructJson): AbiStruct {
    const { name, base, fields } = dto;
    return new AbiStruct(name, base, fields.map(StructField.fromDto));
  }
}
