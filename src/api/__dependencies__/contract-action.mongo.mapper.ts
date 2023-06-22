/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, Mapper, PropertyMapping } from '@alien-worlds/api-core';
import { ContractAction } from '@alien-worlds/api-core';
import { ContractActionMongoModel } from './contract-action.mongo.types';

export class ContractActionMapper implements Mapper {
  public toEntity(model: any): ContractAction {
    throw new Error('Method not implemented.');
  }
  public fromEntity(entity: ContractAction): ContractActionMongoModel {
    throw new Error('Method not implemented.');
  }
  public getEntityKeyMapping(key: string): PropertyMapping {
    throw new Error('Method not implemented.');
  }
}
