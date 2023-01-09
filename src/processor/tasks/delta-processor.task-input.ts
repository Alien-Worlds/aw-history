import { Serialize } from 'eosjs';
import { Abi } from '../../common/abis';
import { AbisSerialize } from '../../common/abis/abis.serialize';
import { DeltaProcessorTaskMessageContent } from '../broadcast/delta-processor-task.message-content';

export class DeltaProcessorTaskInput<DataType = unknown> {
  public static create<DataType = unknown>(
    abi: Abi,
    content: DeltaProcessorTaskMessageContent
  ) {
    const {
      name,
      code,
      scope,
      table,
      present,
      blockNumber,
      blockTimestamp,
      data,
      dataHash,
    } = content;

    const { hex } = abi;

    const sb = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
      array: data,
    });
    sb.get(); // version
    sb.getName(); // code
    sb.getName(); // scope
    sb.getName(); // table
    const primaryKey = Buffer.from(sb.getUint8Array(8)).readBigInt64BE(); // primary_key
    const payer = sb.getName(); // payer
    const bytes = sb.getBytes(); // data bytes

    const deserializedData = AbisSerialize.deserializeTable<DataType>(
      code,
      table,
      bytes,
      hex
    );
    return new DeltaProcessorTaskInput(
      name,
      code,
      scope,
      table,
      payer,
      present,
      primaryKey,
      blockNumber,
      blockTimestamp,
      deserializedData,
      dataHash
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
    public readonly data: DataType,
    public readonly dataHash: string
  ) {}
}
