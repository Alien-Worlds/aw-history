import { ListDeltasInput } from '../models/list-deltas.input';
import {
  ContractDelta,
  inject,
  injectable,
  Result,
  UseCase,
} from '@alien-worlds/api-core';
import { ContractDeltaRepository } from '../repositories/contract-delta.repository';
import { ListDeltasQueryModel } from '../models/list-deltas.query-model';

/*imports*/
/**
 * @class
 */
@injectable()
export class ListDeltasUseCase implements UseCase<ContractDelta[]> {
  public static Token = 'LIST_ACTIONS_USE_CASE';

  constructor(
    @inject(ContractDeltaRepository.Token)
    private contractDeltaRepository: ContractDeltaRepository
  ) {}

  /**
   * @async
   * @returns {Promise<Result<ContractDelta[]>>}
   */
  public async execute(input: ListDeltasInput): Promise<Result<ContractDelta[]>> {
    return this.contractDeltaRepository.find(ListDeltasQueryModel.create(input));
  }

  /*methods*/
}
