import { AbiExtensionDto } from './abi.dtos';

/**
 * @class
 */
export class AbiExtension {
  /**
   *
   * @param {number} tag
   * @param {string} value
   */
  private constructor(public readonly tag: number, public readonly value: string) {}

  /**
   * @returns {AbiExtensionDto}
   */
  public toDto(): AbiExtensionDto {
    const { tag, value } = this;
    return { tag, value };
  }

  /**
   * @static
   * @param {AbiExtensionDto} dto
   * @returns {AbiExtension}
   */
  public static fromDto(dto: AbiExtensionDto): AbiExtension {
    const { tag, value } = dto;
    return new AbiExtension(tag, value);
  }
}
