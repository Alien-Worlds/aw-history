import { AbiErrorMessageDto } from './abi.dtos';

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
   * @returns {AbiErrorMessageDto}
   */
  public toDto(): AbiErrorMessageDto {
    const { errorCode, message } = this;
    return { error_code: errorCode, error_msg: message };
  }

  /**
   * @static
   * @param {AbiErrorMessageDto} dto
   * @returns {AbiErrorMessage}
   */
  public static fromDto(dto: AbiErrorMessageDto): AbiErrorMessage {
    const { error_code, error_msg } = dto;
    return new AbiErrorMessage(error_code, error_msg);
  }
}
