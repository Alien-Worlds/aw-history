/* eslint-disable @typescript-eslint/no-unused-vars */
import { ListActionsInput } from './../models/list-actions.input';
import {
  ContractAction,
  FindParams,
  inject,
  injectable,
  Result,
  UseCase,
} from '@alien-worlds/api-core';
import { ContractActionRepository } from '../repositories/contract-action.repository';

/*imports*/
/**
 * @class
 */
@injectable()
export class ListActionsUseCase implements UseCase<ContractAction[]> {
  public static Token = 'LIST_ACTIONS_USE_CASE';

  constructor(
    @inject(ContractActionRepository.Token)
    private contractActionRepository: ContractActionRepository
  ) {}

  /**
   * @async
   * @returns {Promise<Result<ContractAction[]>>}
   */
  public async execute(input: ListActionsInput): Promise<Result<ContractAction[]>> {
    const result = await this.contractActionRepository.find(
      FindParams.create({ limit: 1 })
    );

    return result;
  }

  /*methods*/
}
