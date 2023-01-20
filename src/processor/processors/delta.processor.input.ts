import { Serialize } from 'eosjs';
import { deserialize } from 'v8';
import { AbisSerialize } from '../../common/abis/abis.serialize';
import {
  DeltaProcessorContentModel,
  ProcessorTaskModel,
} from '../../common/processor-queue/processor-task.types';

export class DeltaProcessorInput<DataType = unknown> {
  public static create<DataType = unknown>(model: ProcessorTaskModel) {
    const { abi, content: buffer } = model;
    const content: DeltaProcessorContentModel = deserialize(buffer);
    const {
      name,
      row: { present, data },
      blockNumber,
      blockTimestamp,
      
    } = content;

    const sb = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
      array: data,
    });
    sb.get(); // version
    const code = sb.getName(); // code
    const scope = sb.getName(); // scope
    const table = sb.getName(); // table
    const primaryKey = Buffer.from(sb.getUint8Array(8)).readBigInt64BE(); // primary_key
    const payer = sb.getName(); // payer
    const bytes = sb.getBytes(); // data bytes

    const deserializedData = AbisSerialize.deserializeTable<DataType>(
      code,
      table,
      bytes,
      abi
    );
    return new DeltaProcessorInput(
      name,
      code,
      scope,
      table,
      payer,
      present,
      primaryKey,
      blockNumber,
      blockTimestamp,
      deserializedData
    );
  }

  private constructor(
    public readonly name: string,
    public readonly code: string,
    public readonly scope: string,
    public readonly table: string,
    public readonly payer: string,
    public readonly present: number,
    public readonly primaryKey: bigint,
    public readonly blockNumber: bigint,
    public readonly blockTimestamp: Date,
    public readonly data: DataType
  ) {}
}
