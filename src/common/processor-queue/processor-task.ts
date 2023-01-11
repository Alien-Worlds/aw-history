import crypto from 'crypto';
import { serialize } from 'v8';
import { Binary, ObjectId, removeUndefinedProperties } from '@alien-worlds/api-core';
import { ActionTrace, DeltaRow } from '../../common/blockchain/block-content';

export enum ProcessorTaskType {
  Action = 'action',
  Delta = 'delta',
}

export type ProcessorTaskDocument = {
  _id?: ObjectId;
  timestamp?: Date;
  type?: string;
  mode?: string;
  content?: Binary;
  hash?: string;
};

export class ProcessorTask {
  public static createActionProcessorTask(
    mode: string,
    shipTraceMessageName: string,
    transactionId: string,
    actionTrace: ActionTrace,
    blockNumber: bigint,
    blockTimestamp: Date
  ) {
    const content = {
      shipTraceMessageName,
      transactionId,
      actionTrace,
      blockNumber,
      blockTimestamp,
    };
    const buffer = serialize(content);
    const hash = crypto.createHash('sha1').update(buffer).digest('hex');

    return new ProcessorTask(null, null, ProcessorTaskType.Action, mode, buffer, hash);
  }

  public static createDeltaProcessorTask(
    mode: string,
    shipDeltaMessageName: string,
    name: string,
    blockNumber: bigint,
    blockTimestamp: Date,
    row: DeltaRow
  ) {
    const content = {
      shipDeltaMessageName,
      name,
      row,
      blockNumber,
      blockTimestamp,
    };
    const buffer = serialize(content);
    const hash = crypto.createHash('sha1').update(buffer).digest('hex');

    return new ProcessorTask(null, null, ProcessorTaskType.Delta, mode, buffer, hash);
  }

  public static fromDocument(document: ProcessorTaskDocument) {
    const { content, timestamp, hash, type, mode, _id } = document;

    return new ProcessorTask(
      _id ? _id.toString() : '',
      timestamp,
      type,
      mode,
      content.buffer,
      hash
    );
  }

  private constructor(
    public readonly id: string,
    public readonly timestamp: Date,
    public readonly type: string,
    public readonly mode: string,
    public readonly content: Buffer,
    public readonly hash: string
  ) {}

  public toDocument(): ProcessorTaskDocument {
    const { id, timestamp, type, mode, content, hash } = this;

    const document: ProcessorTaskDocument = {
      timestamp,
      type,
      mode,
      content: new Binary(content),
      hash,
    };

    if (id) {
      document._id = new ObjectId(id);
    }

    return removeUndefinedProperties<ProcessorTaskDocument>(document);
  }
}
