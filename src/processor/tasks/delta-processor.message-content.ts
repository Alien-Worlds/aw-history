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
    const hash = crypto.createHash('sha1').update(row.data).digest('hex');

    sb.get(); // ?
    const code = sb.getName();
    const scope = sb.getName();
    const table = sb.getName();
    const label = `${shipDeltaMessageName}:${name}:${code}:${scope}:${table}`;
    const primaryKey = Buffer.from(sb.getUint8Array(8)).readBigInt64BE();
    const payer = sb.getName();

    return new DeltaProcessorMessageContent(
      shipDeltaMessageName,
      name,
      code,
      scope,
      table,
      payer,
      Number(row.present),
      primaryKey,
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
      payer,
      present,
      primaryKey,
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
      payer,
      present,
      primaryKey,
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
    public readonly payer: string,
    public readonly present: number,
    public readonly primaryKey: bigint,
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
      payer,
      present,
      primaryKey,
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
      payer,
      present,
      primaryKey,
      blockNumber,
      blockTimestamp,
      data,
      dataHash,
      label,
    });
  }
}
