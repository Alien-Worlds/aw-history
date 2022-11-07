import { RicardianClauseDto } from './abi.dtos';

/**
 * @class
 */
export class RicardianClause {
  /**
   *
   * @param {string} id
   * @param {string} body
   */
  private constructor(public readonly id: string, public readonly body: string) {}

  /**
   * @returns {RicardianClauseDto}
   */
  public toDto(): RicardianClauseDto {
    const { id, body } = this;
    return { id, body };
  }

  /**
   * @static
   * @param {RicardianClauseDto} dto
   * @returns {RicardianClause}
   */
  public static fromDto(dto: RicardianClauseDto): RicardianClause {
    const { id, body } = dto;
    return new RicardianClause(id, body);
  }
}
