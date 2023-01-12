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
  label?: string;
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
    const {
      shipMessageName,
      act: { account, name },
    } = actionTrace;
    const buffer = serialize(content);
    const hash = crypto.createHash('sha1').update(buffer).digest('hex');
    const label = `${shipTraceMessageName}:${shipMessageName}:${account}:${name}`;

    return new ProcessorTask(
      null,
      label,
      null,
      ProcessorTaskType.Action,
      mode,
      buffer,
      hash
    );
  }

  public static createDeltaProcessorTask(
    mode: string,
    shipDeltaMessageName: string,
    name: string,
    code: string,
    scope: string,
    table: string,
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
    const label = `${shipDeltaMessageName}:${name}:${code}:${scope}:${table}`;

    return new ProcessorTask(
      null,
      label,
      null,
      ProcessorTaskType.Delta,
      mode,
      buffer,
      hash
    );
  }

  public static fromDocument(document: ProcessorTaskDocument) {
    const { label, content, timestamp, hash, type, mode, _id } = document;

    return new ProcessorTask(
      _id ? _id.toString() : '',
      label,
      timestamp,
      type,
      mode,
      content.buffer,
      hash
    );
  }

  private constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly timestamp: Date,
    public readonly type: string,
    public readonly mode: string,
    public readonly content: Buffer,
    public readonly hash: string
  ) {}

  public toDocument(): ProcessorTaskDocument {
    const { id, label, timestamp, type, mode, content, hash } = this;

    const document: ProcessorTaskDocument = {
      label,
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
