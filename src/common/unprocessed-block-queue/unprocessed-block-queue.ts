/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Block,
  DataSourceError,
  Failure,
  log,
  Mapper,
  parseToBigInt,
  Result,
} from '@alien-worlds/aw-core';
import { BlockNotFoundError } from './unprocessed-block-queue.errors';
import { UnprocessedBlockSource } from './unprocessed-block-queue.source';
import { BlockModel } from '../types/block.types';
import { InsertionResult } from './unprocessed-block-queue.types';

export abstract class UnprocessedBlockQueueReader {
  public abstract next(): Promise<Result<Block>>;
}

export class UnprocessedBlockQueue<ModelType = unknown>
  implements UnprocessedBlockQueueReader
{
  protected cache: Block[] = [];
  protected overloadHandler: (size: number) => void;
  protected beforeSendBatchHandler: () => void;
  protected afterSendBatchHandler: (successful: boolean) => void;

  constructor(
    protected collection: UnprocessedBlockSource<ModelType>,
    protected mapper: Mapper<Block, ModelType>,
    protected maxBytesSize: number,
    protected batchSize: number,
    protected fastLaneBatchSize: number
  ) {}

  private async sendBatch(): Promise<Result<InsertionResult>> {
    const result: InsertionResult = {
      insertedBlocks: [],
      failedBlocks: [],
      queueOverloadSize: 0,
    };

    try {
      const documents = this.cache.map(block => this.mapper.fromEntity(block));
      this.cache = [];
      const insertedModels = await this.collection.insert({
        documents,
        options: { ordered: false },
      });
      insertedModels.forEach(model => {
        result.insertedBlocks.push(
          parseToBigInt((model as BlockModel).this_block.block_num)
        );
      });
    } catch (error) {
      const { additionalData, isDuplicateError } = error as DataSourceError<{
        failedDocuments: BlockModel[];
      }>;
      if (isDuplicateError === false) {
        if (
          Array.isArray(additionalData.failedDocuments) &&
          additionalData.failedDocuments.length > 0
        ) {
          result.failedBlocks = additionalData.failedDocuments.map(model =>
            parseToBigInt(model.this_block.block_num)
          );
        } else {
          return Result.withFailure(error);
        }
      }
    }

    if (this.maxBytesSize > 0) {
      const currentSize = await this.collection.bytesSize();
      result.queueOverloadSize = currentSize - this.maxBytesSize;
    }

    return Result.withContent(result);
  }

  public async getBytesSize(): Promise<Result<number>> {
    try {
      const currentSize = await this.collection.bytesSize();
      return Result.withContent(currentSize);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  public async add(
    block: Block,
    options?: { isFastLane?: boolean; isLast?: boolean; predictedRangeSize?: number }
  ): Promise<Result<InsertionResult | void>> {
    let result: Result<InsertionResult | void> = Result.withoutContent();
    const { isFastLane, isLast, predictedRangeSize } = options || {};

    const currentBatchSize = isFastLane
      ? predictedRangeSize < this.fastLaneBatchSize
        ? predictedRangeSize
        : this.fastLaneBatchSize
      : predictedRangeSize < this.batchSize
      ? predictedRangeSize
      : this.batchSize;

    if (this.cache.length < currentBatchSize) {
      this.cache.push(block);
    }

    if (this.cache.length === currentBatchSize || isLast) {
      result = await this.sendBatch();
    }
    return result;
  }

  public async next(): Promise<Result<Block>> {
    try {
      const document = await this.collection.next();
      if (document) {
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

  /**
   * Waits for the queue to clear up to a maximum number of tries. Checks the queue size
   * at the specified timeout interval. If the size reaches zero or the maximum number of
   * tries is exceeded, the promise is resolved.
   *
   * @param {number} [timeoutMS=1000] - The time interval (in milliseconds) at which the queue size is checked.
   * @param {number} [maxTries=10] - The maximum number of times the queue size should be checked before giving up.
   *
   * @returns {Promise<null>} A promise that resolves when the queue is cleared or the maximum tries are reached.
   */
  public async waitForQueueToClear(timeoutMS = 1000, maxTries = 10) {
    const { maxBytesSize } = this;
    return new Promise(resolve => {
      let tries = 0;
      const interval = setInterval(async () => {
        if (maxTries && tries >= maxTries) {
          log(`Max tries (${maxTries}) reached without clearing the collection.`);
          clearInterval(interval);
          resolve(null);
          return;
        }

        const { content: currentSize } = await this.getBytesSize();

        if (currentSize === 0) {
          log(`Unprocessed blocks collection cleared, blockchain reading resumed.`);
          clearInterval(interval);
          resolve(null);
        }
        tries++;
      }, timeoutMS);
    });
  }
}
