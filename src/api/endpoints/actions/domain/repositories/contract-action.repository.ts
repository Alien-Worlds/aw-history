import {
  injectable,
  Repository,
  ContractAction,
  ContractActionDocument,
  Entity,
} from '@alien-worlds/api-core';

/**
 * @abstract
 * @class
 */
@injectable()
export abstract class ContractActionRepository<
  DataEntityType extends Entity = Entity,
  DataDocumentType = object
> extends Repository<
  ContractAction<DataEntityType, DataDocumentType>,
  ContractActionDocument<DataDocumentType>
> {
  public static Token = 'CONTRACT_ACTION_REPOSITORY';
}
