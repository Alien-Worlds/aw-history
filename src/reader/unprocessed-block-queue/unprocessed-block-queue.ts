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
  UnprocessedBlocksOverloadError,
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
  private overloadHandler: (size: number) => void;
  private beforeSendBatchHandler: () => void;
  private afterSendBatchHandler: () => void;

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
    this.beforeSendBatchHandler();
    const documnets = this.cache.map(block => block.toDocument());
    const result = await this.mongo.insertMany(documnets);
    result.forEach(document => {
      addedBlockNumbers.push(parseToBigInt(document.this_block.block_num));
    });
    this.cache = [];

    if (this.maxBytesSize > 0 && this.overloadHandler) {
      const sorted = addedBlockNumbers.sort();
      const min = sorted[0];
      const max = sorted.reverse()[0];

      const currentSize = await this.mongo.bytesSize();
      if (currentSize >= this.maxBytesSize) {
        this.overloadHandler(currentSize);
        throw new UnprocessedBlocksOverloadError(min, max);
      }
    }

    this.afterSendBatchHandler();

    return addedBlockNumbers;
  }

  public async getBytesSize(): Promise<Result<number>> {
    try {
      const currentSize = await this.mongo.bytesSize();
      return Result.withContent(currentSize);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  public async add(block: Block, isLast = false): Promise<Result<bigint[]>> {
    try {
      let addedBlockNumbers: bigint[] = [];

      if (this.cache.length < this.batchSize) {
        this.cache.push(block);
      }

      if (this.cache.length === this.batchSize || isLast) {
        addedBlockNumbers = await this.sendBatch();
      }

      return Result.withContent(addedBlockNumbers);
    } catch (error) {
      // it is important to clear the cache in case of errors
      this.cache = [];
      
      if (error instanceof DataSourceBulkWriteError && error.onlyDuplicateErrors) {
        this.afterSendBatchHandler();
        return Result.withFailure(Failure.fromError(new DuplicateBlocksError()));
      }
      return Result.withFailure(Failure.fromError(error));
    }
  }

  public async next(): Promise<Result<Block>> {
    try {
      const document = await this.mongo.next();
      if (document) {
        if (this.maxBytesSize > -1 && this.afterSendBatchHandler) {
          if ((await this.mongo.count({})) === 0 && this.afterSendBatchHandler) {
            this.afterSendBatchHandler();
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

  public afterSendBatch(handler: () => void): void {
    this.afterSendBatchHandler = handler;
  }

  public beforeSendBatch(handler: () => void): void {
    this.beforeSendBatchHandler = handler;
  }

  public onOverload(handler: (size: number) => void): void {
    this.overloadHandler = handler;
  }
}
