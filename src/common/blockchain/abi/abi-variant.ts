import { AbiVariantJson } from './abi.dtos';

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
   * @returns {AbiVariantJson}
   */
  public toDto(): AbiVariantJson {
    const { name, types } = this;
    return { name, types };
  }

  /**
   * @static
   * @param {AbiVariantJson} dto
   * @returns {AbiVariant}
   */
  public static fromDto(dto: AbiVariantJson): AbiVariant {
    const { name, types } = dto;
    return new AbiVariant(name, types);
  }
}
