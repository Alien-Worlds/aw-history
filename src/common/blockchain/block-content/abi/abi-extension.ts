import { AbiExtensionJson } from './abi.dtos';

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
   * @returns {AbiExtensionJson}
   */
  public toDto(): AbiExtensionJson {
    const { tag, value } = this;
    return { tag, value };
  }

  /**
   * @static
   * @param {AbiExtensionJson} dto
   * @returns {AbiExtension}
   */
  public static fromDto(dto: AbiExtensionJson): AbiExtension {
    const { tag, value } = dto;
    return new AbiExtension(tag, value);
  }
}
