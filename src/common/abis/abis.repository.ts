/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ContractEncodedAbiDocument } from './abis.types';
import { ContractEncodedAbi } from './contract-encoded-abi';
import {
  CollectionMongoSource,
  DataSourceBulkWriteError,
  DataSourceOperationError,
  log,
  MongoDB,
  MongoSource,
  OperationErrorType,
} from '@alien-worlds/api-core';
import { AbisCache } from './abis.cache';

export class AbisCollection extends CollectionMongoSource<ContractEncodedAbiDocument> {
  constructor(source: MongoSource) {
    super(source, 'history_tools.abis', {
      indexes: [
        { key: { block_number: 1, hex: 1, contract: 1 }, unique: true, background: true },
      ],
    });
  }
}
export class AbisRepository {
  private cache: AbisCache = new AbisCache();

  constructor(private collection: AbisCollection) {}

  public async cacheAbis(contracts?: string[]) {
    const abis = await this.getAbis({ contracts });
    if (Array.isArray(abis)) {
      this.cache.insertAbis(abis);
    }
  }

  public async getAbis(options: {
    startBlock?: bigint;
    endBlock?: bigint;
    contracts?: string[];
  }): Promise<ContractEncodedAbi[]> {
    try {
      const { startBlock, endBlock, contracts } = options || {};

      const cachedAbis = this.cache.getAbis(options);

      if (cachedAbis.length > 0) {
        return cachedAbis;
      }

      const filter: { block_number?: unknown; contract?: unknown } = {};

      if (startBlock && endBlock) {
        filter.block_number = {
          $gte: MongoDB.Long.fromBigInt(startBlock),
          $lte: MongoDB.Long.fromBigInt(endBlock),
        };
      }

      if (contracts) {
        filter.contract = { $in: contracts };
      }

      const documents = await this.collection.find({ filter });
      const entities = documents.map(ContractEncodedAbi.fromDocument);

      return entities;
    } catch (error) {
      log(error);
      return [];
    }
  }

  public async getAbi(
    blockNumber: bigint,
    contract: string
  ): Promise<ContractEncodedAbi> {
    try {
      const cachedAbi = this.cache.getAbi(blockNumber, contract);

      if (cachedAbi) {
        return cachedAbi;
      }

      const filter: { block_number: unknown; contract: unknown } = {
        block_number: {
          $lte: MongoDB.Long.fromBigInt(blockNumber),
        },
        contract: { $eq: contract },
      };

      const document = await this.collection.findOne({
        filter,
        options: { sort: { block_number: -1 }, limit: 1 },
      });

      return document ? ContractEncodedAbi.fromDocument(document) : null;
    } catch (error) {
      log(error);
      return null;
    }
  }

  public async insertAbi(abi: ContractEncodedAbi): Promise<boolean> {
    try {
      this.cache.insertAbis([abi]);
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

  public async insertAbis(abis: ContractEncodedAbi[]): Promise<boolean> {
    try {
      this.cache.insertAbis(abis);
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
      const filter: MongoDB.Filter<ContractEncodedAbiDocument> = {};
      if (typeof startBlock === 'bigint') {
        filter['block_number'] = { $gte: MongoDB.Long.fromBigInt(startBlock) };
      }

      if (typeof endBlock === 'bigint') {
        filter['block_number'] = { $lte: MongoDB.Long.fromBigInt(endBlock) };
      }

      const count = await this.collection.count({ filter });

      return count;
    } catch (error) {
      return 0;
    }
  }
}
