import { MongoDB, MongoMapper } from '@alien-worlds/storage-mongodb';
import { ContractEncodedAbiMongoModel } from './abis.types';
import { ContractEncodedAbi } from '@alien-worlds/api-core';

export class AbisMongoMapper extends MongoMapper<
  ContractEncodedAbi,
  ContractEncodedAbiMongoModel
> {
  constructor() {
    super();
    this.mappingFromEntity.set('blockNumber', {
      key: 'block_number',
      mapper: (value: bigint) => MongoDB.Long.fromBigInt(value),
    });
    this.mappingFromEntity.set('contract', {
      key: 'contract',
      mapper: value => value,
    });
    this.mappingFromEntity.set('hex', {
      key: 'hex',
      mapper: value => value,
    });
  }
}
