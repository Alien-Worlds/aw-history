/* eslint-disable @typescript-eslint/no-unused-vars */
import { Processor } from './processor';
import {
  ActionProcessorContentModel,
  ProcessorTaskModel,
} from '../../common/processor-task-queue/processor-task.types';
import { ActionTraceProcessorInput, ProcessorSharedData } from '../processor.types';
import { Container, Serializer, parseToBigInt } from '@alien-worlds/api-core';
import { deserialize } from 'v8';

export class ActionTraceProcessor<
  DataType = unknown,
  SharedDataType = ProcessorSharedData
> extends Processor<SharedDataType> {
  protected input: ActionTraceProcessorInput<DataType>;

  constructor(
    protected dependencies: {
      ioc: Container;
      dataSource: unknown;
      serializer: Serializer;
    },
    protected sharedData: SharedDataType
  ) {
    super();
  }

  public deserializeModelContent(
    model: ProcessorTaskModel
  ): ActionTraceProcessorInput<DataType> {
    const {
      dependencies: { serializer },
    } = this;
    const { abi, content: buffer } = model;
    const content: ActionProcessorContentModel = deserialize(buffer);
    const {
      action_trace: {
        act,
        receipt,
      },
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
      blockNumber: parseToBigInt(block_num),
      blockTimestamp: block_timestamp,
      transactionId: transaction_id,
      account: act.account,
      name: act.name,
      recvSequence: parseToBigInt(recv_sequence),
      globalSequence: parseToBigInt(global_sequence),
      data: data as DataType,
    };
  }

  public async run(model: ProcessorTaskModel): Promise<void> {
    this.input = this.deserializeModelContent(model);
  }
}
