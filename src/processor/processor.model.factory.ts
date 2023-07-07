import { Serializer } from '@alien-worlds/api-core';
import {
  ActionProcessorContentModel,
  DeltaProcessorContentModel,
  ProcessorTask,
  ProcessorTaskType,
  UnknownProcessorTypeError,
} from '../common';
import { ActionTraceProcessorModel, DeltaProcessorModel } from './processor.types';
import { deserialize } from 'v8';

export class ProcessorModelFactory {
  constructor(protected serializer: Serializer) {}

  protected buildActionTraceProcessorModel<DataType = unknown>(
    model: ProcessorTask
  ): ActionTraceProcessorModel<DataType> {
    const { serializer } = this;
    const { abi, content: buffer } = model;
    const content: ActionProcessorContentModel = deserialize(buffer);
    const {
      action_trace: { act, receipt },
      block_num,
      block_timestamp,
      transaction_id,
    } = content;

    const [receiptType, receiptContent] = receipt;
    const { global_sequence, recv_sequence } = receiptContent;
    const data = serializer.deserializeActionData<DataType>(
      act.account,
      act.name,
      act.data,
      abi
    );

    return {
      block_number: block_num.toString(),
      block_timestamp,
      transaction_id,
      account: act.account,
      name: act.name,
      recv_sequence,
      global_sequence,
      data: data as DataType,
    };
  }

  protected buildDeltaProcessorModel<DataType = unknown>(
    model: ProcessorTask
  ): DeltaProcessorModel<DataType> {
    const { serializer } = this;
    const { abi, content: buffer } = model;
    const delta: DeltaProcessorContentModel = deserialize(buffer);
    const { name, block_num, block_timestamp } = delta;
    const row = serializer.deserializeTableRow<DataType>(delta, abi);
    const { code, scope, table, primary_key, payer, data, present } = row;

    return {
      name,
      block_number: block_num.toString(),
      block_timestamp,
      code,
      scope,
      table,
      present,
      primary_key,
      payer,
      data: data as DataType,
    };
  }

  public create<DataType = unknown>(
    task: ProcessorTask
  ): ActionTraceProcessorModel<DataType> | DeltaProcessorModel<DataType> {
    if (task.type === ProcessorTaskType.Trace) {
      return this.buildActionTraceProcessorModel(task);
    } else if (task.type === ProcessorTaskType.Delta) {
      return this.buildDeltaProcessorModel(task);
    } else {
      throw new UnknownProcessorTypeError(task.type);
    }
  }
}
