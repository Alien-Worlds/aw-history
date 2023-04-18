import {
  CollectionMongoSource,
  DataSourceOperationError,
  Failure,
  isMongoConfig,
  log,
  MongoConfig,
  MongoSource,
  parseToBigInt,
  Result,
} from '@alien-worlds/api-core';
import { BlockNotFoundError } from './unprocessed-block-queue.errors';
import { Block, BlockDocument } from '../../common/blockchain/block-reader/block';

export class BlockMongoCollection extends CollectionMongoSource<BlockDocument> {
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'blocks', {
      indexes: [
        {
          key: { block_number: 1 },
          background: true,
        },
        {
          key: { block_number: 1 },
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

  public async bytesSize(): Promise<number> {
    const stats = await this.collection.stats();
    return stats.size;
  }
}

export abstract class UnprocessedBlockQueueReader {
  public abstract next(): Promise<Result<Block>>;
}

export class UnprocessedBlockQueue implements UnprocessedBlockQueueReader {
  private cache: Block[];
  private mongo: BlockMongoCollection;
  private overloadHandler: () => void;
  private emptyHandler: () => void;

  public static async create<
    T extends UnprocessedBlockQueue | UnprocessedBlockQueueReader
  >(
    mongo: MongoConfig | MongoSource,
    maxBytesSize?: number,
    batchSize?: number
  ): Promise<T> {
    let mongoSource: MongoSource;
    if (isMongoConfig(mongo)) {
      mongoSource = await MongoSource.create(mongo);
    } else {
      mongoSource = mongo;
    }
    return new UnprocessedBlockQueue(
      mongoSource,
      maxBytesSize || 0,
      batchSize | 100
    ) as T;
  }

  private constructor(
    mongoSource: MongoSource,
    private maxBytesSize: number,
    private batchSize: number
  ) {
    this.mongo = new BlockMongoCollection(mongoSource);
    this.cache = [];
  }

  public async add(block: Block): Promise<Result<bigint[]>> {
    try {
      const addedBlockNumbers: bigint[] = [];
      this.cache.push(block);

      if (this.maxBytesSize > 0 && this.overloadHandler) {
        if ((await this.mongo.bytesSize()) >= this.maxBytesSize) {
          this.overloadHandler();
        }
      }

      if (this.cache.length >= this.batchSize) {
        this.overloadHandler();
        const documnets = this.cache.map(block => block.toDocument());
        const result = await this.mongo.insertMany(documnets);
        result.forEach(document => {
          addedBlockNumbers.push(parseToBigInt(document.this_block.block_num));
        });
        this.cache = [];
        this.emptyHandler();
      }

      return Result.withContent(addedBlockNumbers);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  public async next(): Promise<Result<Block>> {
    try {
      const document = await this.mongo.next();
      if (document) {
        if (this.maxBytesSize > -1 && this.emptyHandler) {
          if ((await this.mongo.count({})) === 0 && this.emptyHandler) {
            this.emptyHandler();
          }
        }

        return Result.withContent(Block.fromDocument(document));
      }
      return Result.withFailure(Failure.fromError(new BlockNotFoundError()));
    } catch (error) {
      log(`Could not get next task due to: ${error.message}`);
      return Result.withFailure(Failure.fromError(error));
    }
  }

  public onEmpty(handler: () => void): void {
    this.emptyHandler = handler;
  }

  public onOverload(handler: () => void): void {
    this.overloadHandler = handler;
  }
}
