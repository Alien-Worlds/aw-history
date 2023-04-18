import { AbiErrorMessageJson } from './abi.dtos';

/**
 * @class
 */
export class AbiErrorMessage {
  /**
   *
   * @param {number} errorCode
   * @param {string} message
   */
  private constructor(
    public readonly errorCode: number,
    public readonly message: string
  ) {}

  /**
   * @returns {AbiErrorMessageJson}
   */
  public toDto(): AbiErrorMessageJson {
    const { errorCode, message } = this;
    return { error_code: errorCode, error_msg: message };
  }

  /**
   * @static
   * @param {AbiErrorMessageJson} dto
   * @returns {AbiErrorMessage}
   */
  public static fromDto(dto: AbiErrorMessageJson): AbiErrorMessage {
    const { error_code, error_msg } = dto;
    return new AbiErrorMessage(error_code, error_msg);
  }
}
