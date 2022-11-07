import { AbiActionDto } from './abi.dtos';

/**
 * @class
 */
export class AbiAction {
  /**
   *
   * @param {string} name - The name of the action as defined in the contract
   * @param {string} type - The name of the implicit struct as described in the ABI
   * @param {string=} ricardianContract - An optional ricardian clause to associate to this action describing its intended functionality.
   */
  private constructor(
    public readonly name: string,
    public readonly type: string,
    public readonly ricardianContract?: string
  ) {}

  /**
   * @returns {AbiActionDto}
   */
  public toDto(): AbiActionDto {
    const { name, type, ricardianContract } = this;
    return {
      name,
      type,
      ricardian_contract: ricardianContract,
    };
  }

  /**
   * @static
   * @param {AbiActionDto} dto
   * @returns {AbiAction}
   */
  public static fromDto(dto: AbiActionDto): AbiAction {
    const { name, type, ricardian_contract } = dto;
    return new AbiAction(name, type, ricardian_contract);
  }
}
