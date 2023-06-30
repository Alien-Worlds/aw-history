import { Processor } from './processor';
import { DeltaProcessorInput, ProcessorSharedData } from '../processor.types';
import { deserialize } from 'v8';
import { Container, Serializer, parseToBigInt } from '@alien-worlds/api-core';
import { ProcessorTaskModel, DeltaProcessorContentModel } from '../../common';

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
    const { name, block_num, block_timestamp } = delta;
    const row = serializer.deserializeTableRow<DataType>(delta.row_data, abi);
    const { code, scope, table, primary_key, payer, data } = row;

    return {
      name,
      blockNumber: block_num,
      blockTimestamp: block_timestamp,
      code,
      scope,
      table,
      primaryKey: parseToBigInt(primary_key),
      payer,
      data: data as DataType,
    };
  }

  public async run(model: ProcessorTaskModel): Promise<void> {
    this.input = this.deserializeModelContent(model);
  }
}
