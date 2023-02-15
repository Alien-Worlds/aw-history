import { ListActionsInput } from './../models/list-actions.input';
import {
  ContractAction,
  inject,
  injectable,
  Result,
  UseCase,
} from '@alien-worlds/api-core';
import { ContractActionRepository } from '../repositories/contract-action.repository';
import { ListActionsQueryModel } from '../models/list-actions.query-model';

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
    return this.contractActionRepository.find(ListActionsQueryModel.create(input));
  }

  /*methods*/
}
