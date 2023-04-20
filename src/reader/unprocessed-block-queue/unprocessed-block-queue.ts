import {
  CollectionMongoSource,
  DataSourceBulkWriteError,
  DataSourceOperationError,
  Failure,
  isMongoConfig,
  log,
  MongoConfig,
  MongoSource,
  parseToBigInt,
  Result,
} from '@alien-worlds/api-core';
import {
  BlockNotFoundError,
  DuplicateBlocksError,
} from './unprocessed-block-queue.errors';
import { Block, BlockDocument } from '../../common/blockchain/block-reader/block';

export class BlockMongoCollection extends CollectionMongoSource<BlockDocument> {
  constructor(mongoSource: MongoSource) {
    super(mongoSource, 'history_tools.unprocessed_blocks', {
      indexes: [
        {
          key: { 'this_block.block_num': 1 },
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

  private async sendBatch() {
    const addedBlockNumbers = [];
    this.overloadHandler();
    const documnets = this.cache.map(block => block.toDocument());
    const result = await this.mongo.insertMany(documnets);
    result.forEach(document => {
      addedBlockNumbers.push(parseToBigInt(document.this_block.block_num));
    });
    this.cache = [];
    this.emptyHandler();

    return addedBlockNumbers;
  }

  public async add(block: Block, isLast = false): Promise<Result<bigint[]>> {
    try {
      let addedBlockNumbers: bigint[] = [];

      if (this.maxBytesSize > 0 && this.overloadHandler) {
        if ((await this.mongo.bytesSize()) >= this.maxBytesSize) {
          this.overloadHandler();
        }
      }

      if (isLast) {
        this.cache.push(block);
        addedBlockNumbers = await this.sendBatch();
      } else if (this.cache.length < this.batchSize) {
        this.cache.push(block);
      } else {
        addedBlockNumbers = await this.sendBatch();
        this.cache.push(block);
      }

      return Result.withContent(addedBlockNumbers);
    } catch (error) {
      // it is important to clear the cache in case of errors so as not to fall
      // into the last condition in the code above
      this.cache = [];
      this.emptyHandler();
      if (error instanceof DataSourceBulkWriteError && error.onlyDuplicateErrors) {
        return Result.withFailure(Failure.fromError(new DuplicateBlocksError()));
      }
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

  public async getMax(): Promise<Result<Block>> {
    try {
      const documents = await this.mongo.aggregate({
        pipeline: [{ $sort: { 'this_block.block_num': -1 } }, { $limit: 1 }],
      });
      if (documents.length > 0) {
        return Result.withContent(Block.fromDocument(documents[0]));
      }
      return Result.withFailure(Failure.fromError(new BlockNotFoundError()));
    } catch (error) {
      log(`Could not get block with highest block number due to: ${error.message}`);
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
