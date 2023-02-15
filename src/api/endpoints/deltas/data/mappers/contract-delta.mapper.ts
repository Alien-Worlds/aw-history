import { Entity, Mapper } from '@alien-worlds/api-core';
import { ContractDelta, ContractDeltaDocument } from '@alien-worlds/api-core';

/*imports*/

type MapperType = (data: object) => Entity;

export class ContractDeltaMapper implements Mapper<ContractDelta, ContractDeltaDocument> {
  private mapper: MapperType;

  constructor(mapper?: MapperType) {
    if (mapper) {
      this.mapper = mapper;
    } else {
      this.mapper = (data: object) =>
        ({
          toDocument: () => data,
        } as Entity);
    }
  }

  public toEntity(document: ContractDeltaDocument): ContractDelta {
    return ContractDelta.fromDocument(document, this.mapper);
  }
  public toDataObject(entity: ContractDelta): ContractDeltaDocument {
    return entity.toDocument();
  }
}
