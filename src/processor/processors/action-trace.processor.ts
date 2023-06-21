import { Processor } from './processor';
import {
  ActionProcessorContentModel,
  ProcessorTaskModel,
} from '../../common/processor-task-queue/processor-task.types';
import { ActionTraceProcessorInput, ProcessorSharedData } from '../processor.types';
import { Container, Serializer } from '@alien-worlds/api-core';
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
      actionTrace: {
        act,
        receipt: { recvSequence, globalSequence },
      },
      blockNumber,
      blockTimestamp,
      transactionId,
    } = content;

    const data = serializer.deserializeActionData<DataType>(
      act.account,
      act.name,
      act.data,
      abi
    );

    return {
      blockNumber,
      blockTimestamp,
      transactionId,
      account: act.account,
      name: act.name,
      recvSequence,
      globalSequence,
      data: data as DataType,
    };
  }

  public async run(model: ProcessorTaskModel): Promise<void> {
    this.input = this.deserializeModelContent(model);
  }
}
