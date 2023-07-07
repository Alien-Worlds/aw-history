/* eslint-disable @typescript-eslint/no-unused-vars */
import { Processor } from './processor';
import { ActionTraceProcessorModel, ProcessorSharedData } from '../processor.types';
import { Container, Serializer } from '@alien-worlds/api-core';

export class ActionTraceProcessor<
  DataType = unknown,
  SharedDataType = ProcessorSharedData
> extends Processor<ActionTraceProcessorModel<DataType>, SharedDataType> {
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
}
