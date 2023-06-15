import crypto from 'crypto';
import { serialize } from 'v8';
import {
  parseToBigInt,
  removeUndefinedProperties,
} from '@alien-worlds/api-core';
import { ActionTrace, DeltaRow } from '../../common/blockchain/contract';
import {
  DeltaProcessorContentModel,
  ProcessorTaskDocument,
  ProcessorTaskError,
} from './processor-task.types';
import { MongoDB } from '@alien-worlds/storage-mongodb';

export enum ProcessorTaskType {
  Action = 'action',
  Delta = 'delta',
}

export class ProcessorTask {
  public static createActionProcessorTask(
    abi: string,
    mode: string,
    shipTraceMessageName: string,
    transactionId: string,
    actionTrace: ActionTrace,
    blockNumber: bigint,
    blockTimestamp: Date,
    isFork: boolean
  ) {
    const {
      shipMessageName,
      act: { account, name, data },
      receipt,
    } = actionTrace;

    const buffer = serialize({
      transactionId,
      actionTrace,
      blockNumber,
      blockTimestamp,
    });
    const hashBuffer = serialize({
      account,
      name,
      data,
      transactionId,
      blockNumber,
      blockTimestamp,
      receipt,
    });

    const hash = crypto.createHash('sha1').update(hashBuffer).digest('hex');
    const shortId = `${account}:${name}`;
    const label = `${shipTraceMessageName}:${shipMessageName}:${shortId}`;

    return new ProcessorTask(
      null,
      abi,
      shortId,
      label,
      null,
      ProcessorTaskType.Action,
      mode,
      buffer,
      hash,
      blockNumber,
      blockTimestamp,
      isFork
    );
  }

  public static createDeltaProcessorTask(
    abi: string,
    mode: string,
    shipDeltaMessageName: string,
    name: string,
    code: string,
    scope: string,
    table: string,
    blockNumber: bigint,
    blockTimestamp: Date,
    row: DeltaRow,
    isFork: boolean
  ) {
    const content: DeltaProcessorContentModel = {
      shipDeltaMessageName,
      name,
      row,
      blockNumber,
      blockTimestamp,
    };
    const buffer = serialize(content);
    const hash = crypto.createHash('sha1').update(buffer).digest('hex');
    const shortId = `${code}:${scope}:${table}`;
    const label = `${shipDeltaMessageName}:${name}:${shortId}`;

    return new ProcessorTask(
      null,
      abi,
      shortId,
      label,
      null,
      ProcessorTaskType.Delta,
      mode,
      buffer,
      hash,
      blockNumber,
      blockTimestamp,
      isFork
    );
  }

  public static fromDocument(document: ProcessorTaskDocument) {
    const {
      abi,
      short_id,
      label,
      content,
      timestamp,
      hash,
      type,
      mode,
      _id,
      block_number,
      block_timestamp,
      error,
      is_fork,
    } = document;

    return new ProcessorTask(
      _id ? _id.toString() : '',
      abi,
      short_id,
      label,
      timestamp,
      type,
      mode,
      content.buffer,
      hash,
      parseToBigInt(block_number),
      block_timestamp,
      is_fork,
      error
    );
  }

  private constructor(
    public readonly id: string,
    public readonly abi: string,
    public readonly shortId: string,
    public readonly label: string,
    public readonly timestamp: Date,
    public readonly type: string,
    public readonly mode: string,
    public readonly content: Buffer,
    public readonly hash: string,
    public readonly blockNumber: bigint,
    public readonly blockTimestamp: Date,
    public readonly isFork: boolean,
    public readonly error?: ProcessorTaskError
  ) {}

  public toDocument(): ProcessorTaskDocument {
    const {
      id,
      abi,
      shortId,
      label,
      timestamp,
      type,
      mode,
      content,
      hash,
      blockNumber,
      isFork,
      blockTimestamp,
      error,
    } = this;

    const document: ProcessorTaskDocument = {
      abi,
      short_id: shortId,
      label,
      timestamp,
      type,
      mode,
      content: new MongoDB.Binary(content),
      hash,
      block_number: MongoDB.Long.fromBigInt(blockNumber),
      block_timestamp: blockTimestamp,
      is_fork: isFork,
      error,
    };

    if (id) {
      document._id = new MongoDB.ObjectId(id);
    }

    return removeUndefinedProperties<ProcessorTaskDocument>(document);
  }
}
