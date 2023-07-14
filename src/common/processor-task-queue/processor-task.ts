import crypto from 'crypto';
import { serialize } from 'v8';
import { DeltaProcessorContentModel, ProcessorTaskError } from './processor-task.types';
import { ActionTrace } from '../types';
import { ProcessorTaskType } from './processor-task.enums';
import { Row } from '@alien-worlds/api-core';

export class ProcessorTask {
  public static createActionProcessorTask(
    abi: string,
    mode: string,
    shipTraceMessageName: string,
    shipMessageName: string,
    transactionId: string,
    actionTrace: ActionTrace,
    blockNumber: bigint,
    blockTimestamp: Date,
    isFork: boolean
  ) {
    const {
      act: { account, name, data },
      receipt,
    } = actionTrace;

    const buffer = serialize({
      transaction_id: transactionId,
      action_trace: actionTrace,
      block_num: blockNumber.toString(),
      block_timestamp: blockTimestamp,
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
      ProcessorTaskType.Trace,
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
    type: string,
    name: string,
    code: string,
    scope: string,
    table: string,
    blockNumber: bigint,
    blockTimestamp: Date,
    row: Row,
    isFork: boolean
  ) {
    const { present, data } = row;
    const content: DeltaProcessorContentModel = {
      ship_delta_message_name: type,
      name,
      present,
      data,
      block_num: blockNumber,
      block_timestamp: blockTimestamp,
    };
    const buffer = serialize(content);
    const hash = crypto.createHash('sha1').update(buffer).digest('hex');
    const shortId = `${code}:${scope}:${table}`;
    const label = `${type}:${name}:${shortId}`;

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

  constructor(
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
}
