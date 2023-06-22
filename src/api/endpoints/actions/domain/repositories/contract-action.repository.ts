import { injectable, Repository, ContractAction } from '@alien-worlds/api-core';

/**
 * @abstract
 * @class
 */
@injectable()
export abstract class ContractActionRepository extends Repository<ContractAction> {
  public static Token = 'CONTRACT_ACTION_REPOSITORY';
}
