import { AbiTypeDto } from './abi.dtos';

/**
 * Type entity
 * @class
 */
export class AbiType {
  /**
   *
   * @param {string} newTypeName
   * @param {string} type
   */
  private constructor(
    public readonly newTypeName: string,
    public readonly type: string
  ) {}

  /**
   * Parse Type entity to DTO
   * @returns {AbiTypeDto}
   */
  public toDto(): AbiTypeDto {
    return {
      new_type_name: this.newTypeName,
      type: this.type,
    };
  }

  /**
   * Create ABI entity based on provided DTO
   *
   * @static
   * @param {AbiTypeDto} dto
   * @returns {AbiType}
   */
  public static fromDto(dto: AbiTypeDto): AbiType {
    const { new_type_name, type } = dto;
    return new AbiType(new_type_name, type);
  }
}
