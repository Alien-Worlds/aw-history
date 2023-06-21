import {
  DeltaProcessorContentModel,
  ProcessorTaskModel,
} from '../../common/processor-task-queue/processor-task.types';
import { Processor } from './processor';
import { DeltaProcessorInput, ProcessorSharedData } from '../processor.types';
import { Container, Serializer, parseToBigInt } from '@alien-worlds/api-core';
import { deserialize } from 'v8';

export class DeltaProcessor<
  DataType,
  SharedDataType = ProcessorSharedData
> extends Processor<SharedDataType> {
  protected input: DeltaProcessorInput<DataType>;

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
  ): DeltaProcessorInput<DataType> {
    const {
      dependencies: { serializer },
    } = this;
    const { abi, content: buffer } = model;
    const delta: DeltaProcessorContentModel = deserialize(buffer);
    const { name, blockNumber, blockTimestamp } = delta;
    const row = serializer.deserializeTableRow<DataType>(delta.row.data, abi);
    const { code, scope, table, primaryKey, payer, data } = row;

    return {
      name,
      blockNumber,
      blockTimestamp,
      present: delta.row.present,
      code,
      scope,
      table,
      primaryKey: parseToBigInt(primaryKey),
      payer,
      data: data as DataType,
    };
  }

  public async run(model: ProcessorTaskModel): Promise<void> {
    this.input = this.deserializeModelContent(model);
  }
}
