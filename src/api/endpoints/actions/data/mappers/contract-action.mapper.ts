import { Entity, Mapper } from '@alien-worlds/api-core';
import { ContractAction } from '@alien-worlds/api-core';

/*imports*/

type MapperType = (data: object) => Entity;

export class ContractActionMapper
  implements Mapper<ContractAction, ContractActionDocument>
{


  
  // private mapper: MapperType;

  // constructor(mapper?: MapperType) {
  //   if (mapper) {
  //     this.mapper = mapper;
  //   } else {
  //     this.mapper = (data: object) =>
  //       ({
  //         toDocument: () => data,
  //       } as Entity);
  //   }
  // }

  // public toEntity(document: ContractActionDocument): ContractAction {
  //   return ContractAction.fromDocument(document, this.mapper);
  // }
  // public toDataObject(entity: ContractAction): ContractActionDocument {
  //   return entity.toDocument();
  // }
}
