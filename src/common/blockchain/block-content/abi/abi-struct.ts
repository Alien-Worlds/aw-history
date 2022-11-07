/* eslint-disable @typescript-eslint/unbound-method */
import { AbiStructDto, FieldDto } from './abi.dtos';

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
   * @returns {FieldDto}
   */
  public toDto(): FieldDto {
    const { name, type } = this;
    return { name, type };
  }

  /**
   * @static
   * @param {FieldDto} dto
   * @returns {StructField}
   */
  public static fromDto(dto: FieldDto): StructField {
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
   * @returns {AbiStructDto}
   */
  public toDto(): AbiStructDto {
    return {
      name: this.name,
      base: this.base,
      fields: this.fields.map(field => field.toDto()),
    };
  }

  /**
   * @static
   * @param {AbiStructDto} dto
   * @returns {AbiStruct}
   */
  public static fromDto(dto: AbiStructDto): AbiStruct {
    const { name, base, fields } = dto;
    return new AbiStruct(name, base, fields.map(StructField.fromDto));
  }
}
