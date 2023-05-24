import { RicardianClauseJson } from './abi.dtos';

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
   * @returns {RicardianClauseJson}
   */
  public toDto(): RicardianClauseJson {
    const { id, body } = this;
    return { id, body };
  }

  /**
   * @static
   * @param {RicardianClauseJson} dto
   * @returns {RicardianClause}
   */
  public static fromDto(dto: RicardianClauseJson): RicardianClause {
    const { id, body } = dto;
    return new RicardianClause(id, body);
  }
}
