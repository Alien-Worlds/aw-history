/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AbiDocument } from './abis.types';
import { Abi } from './abi';
import {
  CollectionMongoSource,
  DataSourceBulkWriteError,
  DataSourceOperationError,
  Filter,
  log,
  Long,
  MongoSource,
  OperationErrorType,
} from '@alien-worlds/api-core';

export class AbisCollection extends CollectionMongoSource<AbiDocument> {
  constructor(source: MongoSource) {
    super(source, 'abis');
  }
}
export class AbisRepository {
  constructor(private collection: AbisCollection) {}

  public async getAbis(
    startBlock: bigint,
    endBlock: bigint,
    contract?: string
  ): Promise<Abi[]> {
    try {
      const filter: { block_number: unknown; contract?: unknown } = {
        block_number: {
          $gte: Long.fromBigInt(startBlock),
          $lte: Long.fromBigInt(endBlock),
        },
      };

      if (contract) {
        filter.contract = { $eq: contract };
      }

      const documents = await this.collection.find({ filter });

      return documents.map(Abi.fromDocument);
    } catch (error) {
      log(error);
      return [];
    }
  }

  public async getAbi(blockNumber: bigint, contract: string): Promise<Abi> {
    try {
      const filter: { block_number: unknown; contract?: unknown } = {
        block_number: {
          $lte: Long.fromBigInt(blockNumber),
        },
      };

      if (contract) {
        filter.contract = { $eq: contract };
      }

      const document = await this.collection.findOne({
        filter,
        options: { sort: { block_number: -1 }, limit: 1 },
      });

      return document ? Abi.fromDocument(document) : null;
    } catch (error) {
      log(error);
      return null;
    }
  }

  public async insertAbi(abi: Abi): Promise<boolean> {
    try {
      const result = await this.collection.insert(abi.toDocument());
      return !!result;
    } catch (error) {
      const { type } = error as DataSourceOperationError;
      if (type !== OperationErrorType.Duplicate) {
        log(error);
      }
      return false;
    }
  }

  public async insertManyAbis(abis: Abi[]): Promise<boolean> {
    try {
      const documents = abis.map(abi => abi.toDocument());
      const result = await this.collection.insertMany(documents);
      return result.length > 0;
    } catch (error) {
      const { writeErrors } = error as DataSourceBulkWriteError;

      if (writeErrors && writeErrors.length > 0) {
        writeErrors.forEach(error => {
          if (error.type !== OperationErrorType.Duplicate) {
            log(error);
          }
        });
      }

      return false;
    }
  }

  public async countAbis(startBlock?: bigint, endBlock?: bigint): Promise<number> {
    try {
      const filter: Filter<AbiDocument> = {};
      if (typeof startBlock === 'bigint') {
        filter['start_block'] = { $gte: Long.fromBigInt(startBlock) };
      }

      if (typeof endBlock === 'bigint') {
        filter['end_block'] = { $lte: Long.fromBigInt(endBlock) };
      }

      const count = await this.collection.count({ filter });

      return count;
    } catch (error) {
      return 0;
    }
  }
}