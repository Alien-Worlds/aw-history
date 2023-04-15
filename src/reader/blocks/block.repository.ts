import {
  CollectionMongoSource,
  DataSourceOperationError,
  Failure,
  log,
  MongoConfig,
  MongoSource,
  RepositoryImpl,
  Result,
} from '@alien-worlds/api-core';
import { BlockDocument } from '../../common/blockchain/block-reader';
import { Block } from './block';
import { BlockNotFoundError } from './block.errors';

export const isMongoConfig = (value: unknown): value is MongoConfig => {
  return Array.isArray(value['hosts']) && typeof value['database'] === 'string';
};

export class BlockMongoCollection extends CollectionMongoSource<BlockDocument> {
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'blocks', {
      indexes: [
        {
          key: { block_num: 1 },
          background: true,
        },
        {
          key: { block_id: 1 },
          background: true,
        },
        {
          key: { block_num: 1 },
          unique: true,
          background: true,
        },
      ],
    });
  }

  public async next(): Promise<BlockDocument> {
    try {
      const result = await this.collection.findOneAndDelete({});
      return result.value;
    } catch (error) {
      throw DataSourceOperationError.fromError(error);
    }
  }
}

export abstract class BlockRepository {
  public static async create(mongo: MongoSource | MongoConfig): Promise<BlockRepository> {
    let mongoSource: MongoSource;

    if (isMongoConfig(mongo)) {
      mongoSource = await MongoSource.create(mongo);
    } else {
      mongoSource = mongo;
    }

    return new BlockRepositoryImpl(new BlockMongoCollection(mongoSource), {
      toEntity: (document: BlockDocument) => Block.fromDocument(document),
      toDataObject: (entity: Block) => entity.toDocument(),
    });
  }

  public abstract addBlock(entity: Block): Promise<Result<bigint[]>>;
  public abstract next(): Promise<Result<Block>>;
}

export class BlockRepositoryImpl extends RepositoryImpl<Block, BlockDocument> {
  private cache: Block[];
  private batchSize = 100;

  public async addBlock(entity: Block): Promise<Result<bigint[]>> {
    this.cache.push(entity);

    if (this.cache.length >= this.batchSize) {
      const result = await super.addMany(this.cache);

      if (result.isFailure) {
        log(
          `Something went wrong, blocks should be moved from cache to database. The operation failed.`,
          result.failure.error
        );
        return Result.withContent([]);
      } else {
        const result = Result.withContent(
          this.cache.map(block => block.thisBlock.blockNumber)
        );
        this.cache = [];
        return result;
      }
    }

    return Result.withContent([]);
  }

  public async next(): Promise<Result<Block>> {
    try {
      const document = await (<BlockMongoCollection>this.source).next();
      if (document) {
        return Result.withContent(Block.fromDocument(document));
      }
      return Result.withFailure(Failure.fromError(new BlockNotFoundError()));
    } catch (error) {
      log(`Could not get next task due to: ${error.message}`);
      return Result.withFailure(Failure.fromError(error));
    }
  }
}
