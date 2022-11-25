import { Serialize } from 'eosjs';
import { DeltaRow } from '../../common/blockchain/block-content';
import crypto from 'crypto';
import { deserialize, serialize } from 'v8';
import { DeltaMessageBufferData, ProcessorMessageContent } from '../processor.types';
import { BroadcastMessageContent } from '../../common/broadcast';

export class DeltaProcessorMessageContent
  implements BroadcastMessageContent, ProcessorMessageContent
{
  public static create(
    shipDeltaMessageName: string,
    name: string,
    blockNumber: bigint,
    blockTimestamp: Date,
    row: DeltaRow
  ) {
    const sb = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
      array: row.data,
    });

    sb.get(); // version
    const code = sb.getName(); // code
    const scope = sb.getName(); // scope
    const table = sb.getName(); // table
    const label = `${shipDeltaMessageName}:${name}:${code}:${scope}:${table}`;
    const hash = crypto.createHash('sha1').update(row.data).digest('hex');


    return new DeltaProcessorMessageContent(
      shipDeltaMessageName,
      name,
      code,
      scope,
      table,
      Number(row.present),
      blockNumber,
      blockTimestamp,
      row.data,
      hash,
      label
    );
  }

  public static fromMessageBuffer(buffer: Buffer) {
    const {
      shipDeltaMessageName,
      name,
      code,
      scope,
      table,
      present,
      blockNumber,
      blockTimestamp,
      data,
      dataHash,
      label,
    } = deserialize(buffer) as DeltaMessageBufferData;

    return new DeltaProcessorMessageContent(
      shipDeltaMessageName,
      name,
      code,
      scope,
      table,
      present,
      blockNumber,
      blockTimestamp,
      data,
      dataHash,
      label
    );
  }

  private constructor(
    public readonly shipDeltaMessageName: string,
    public readonly name: string,
    public readonly code: string,
    public readonly scope: string,
    public readonly table: string,
    public readonly present: number,
    public readonly blockNumber: bigint,
    public readonly blockTimestamp: Date,
    public readonly data: Uint8Array,
    public readonly dataHash: string,
    public readonly label: string
  ) {}

  public toBuffer(): Buffer {
    const {
      shipDeltaMessageName,
      name,
      code,
      scope,
      table,
      present,
      blockNumber,
      blockTimestamp,
      data,
      dataHash,
      label,
    } = this;

    return serialize({
      shipDeltaMessageName,
      name,
      code,
      scope,
      table,
      present,
      blockNumber,
      blockTimestamp,
      data,
      dataHash,
      label,
    });
  }
}
