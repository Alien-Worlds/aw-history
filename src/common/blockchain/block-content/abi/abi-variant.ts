import { AbiVariantDto } from './abi.dtos';

/**
 * @class
 */
export class AbiVariant {
  /**
   *
   * @param {string} name
   * @param {string[]} types
   */
  private constructor(public readonly name: string, public readonly types: string[]) {}

  /**
   * @returns {AbiVariantDto}
   */
  public toDto(): AbiVariantDto {
    const { name, types } = this;
    return { name, types };
  }

  /**
   * @static
   * @param {AbiVariantDto} dto
   * @returns {AbiVariant}
   */
  public static fromDto(dto: AbiVariantDto): AbiVariant {
    const { name, types } = dto;
    return new AbiVariant(name, types);
  }
}
