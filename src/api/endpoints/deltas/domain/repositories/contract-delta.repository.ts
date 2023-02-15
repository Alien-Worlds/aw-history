import {
  injectable,
  Repository,
  ContractDelta,
  ContractDeltaDocument,
  Entity,
} from '@alien-worlds/api-core';

/**
 * @abstract
 * @class
 */
@injectable()
export abstract class ContractDeltaRepository<
  DataEntityType extends Entity = Entity,
  DataDocumentType = object
> extends Repository<
  ContractDelta<DataEntityType, DataDocumentType>,
  ContractDeltaDocument<DataDocumentType>
> {
  public static Token = 'CONTRACT_ACTION_REPOSITORY';
}
