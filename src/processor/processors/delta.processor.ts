import { Processor } from './processor';
import { DeltaProcessorModel, ProcessorSharedData } from '../processor.types';
import { Container, Serializer } from '@alien-worlds/api-core';

export class DeltaProcessor<
  DataType = unknown,
  SharedDataType = ProcessorSharedData
> extends Processor<DeltaProcessorModel<DataType>, SharedDataType> {
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
