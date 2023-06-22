import { MongoDB, MongoMapper } from '@alien-worlds/storage-mongodb';
import { ContractEncodedAbi } from '@alien-worlds/api-core';
import { ContractEncodedAbiMongoModel } from './abis.mongo.types';

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
