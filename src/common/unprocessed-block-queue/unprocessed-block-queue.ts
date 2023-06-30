import {
  DataSourceError,
  Failure,
  log,
  Mapper,
  parseToBigInt,
  Result,
} from '@alien-worlds/api-core';
import {
  BlockNotFoundError,
  DuplicateBlocksError,
  UnprocessedBlocksOverloadError,
} from './unprocessed-block-queue.errors';
import { Block } from '@alien-worlds/block-reader';
import { UnprocessedBlockSource } from './unprocessed-block-queue.source';
import { BlockModel } from '../types/block.types';

export abstract class UnprocessedBlockQueueReader {
  public abstract next(): Promise<Result<Block>>;
}

export class UnprocessedBlockQueue<ModelType = unknown>
  implements UnprocessedBlockQueueReader
{
  protected cache: Block[] = [];
  protected overloadHandler: (size: number) => void;
  protected beforeSendBatchHandler: () => void;
  protected afterSendBatchHandler: () => void;

  constructor(
    protected collection: UnprocessedBlockSource<ModelType>,
    protected mapper: Mapper<Block, ModelType>,
    protected maxBytesSize: number,
    protected batchSize: number
  ) {}

  private async sendBatch() {
    const addedBlockNumbers = [];
    this.beforeSendBatchHandler();
    const documnets = this.cache.map(block => this.mapper.fromEntity(block));
    const result = await this.collection.insert(documnets);
    result.forEach(model => {
      addedBlockNumbers.push(parseToBigInt((model as BlockModel).this_block.block_num));
    });
    this.cache = [];

    if (this.maxBytesSize > 0 && this.overloadHandler) {
      const sorted = addedBlockNumbers.sort();
      const min = sorted[0];
      const max = sorted.reverse()[0];

      const currentSize = await this.collection.bytesSize();
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
      const currentSize = await this.collection.bytesSize();
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

      if (error instanceof DataSourceError && error.isDuplicateError) {
        this.afterSendBatchHandler();
        return Result.withFailure(Failure.fromError(new DuplicateBlocksError()));
      }
      return Result.withFailure(Failure.fromError(error));
    }
  }

  public async next(): Promise<Result<Block>> {
    try {
      const document = await this.collection.next();
      if (document) {
        if (this.maxBytesSize > -1 && this.afterSendBatchHandler) {
          if ((await this.collection.count()) === 0 && this.afterSendBatchHandler) {
            this.afterSendBatchHandler();
          }
        }

        return Result.withContent(this.mapper.toEntity(document));
      }
      return Result.withFailure(Failure.fromError(new BlockNotFoundError()));
    } catch (error) {
      log(`Could not get next task due to: ${error.message}`);
      return Result.withFailure(Failure.fromError(error));
    }
  }

  public async getMax(): Promise<Result<Block>> {
    try {
      const documents = await this.collection.aggregate({
        pipeline: [{ $sort: { 'this_block.block_num': -1 } }, { $limit: 1 }],
      });
      if (documents.length > 0) {
        return Result.withContent(this.mapper.toEntity(documents[0]));
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
