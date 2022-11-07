import * as Amq from 'amqplib';
import { BroadcastMessage } from '../broadcast.types';

export class BroadcastAmqMessage<ContentType = unknown>
  implements BroadcastMessage<ContentType>
{
  /**
   * @constructor
   * @param {string} id
   * @param {ContentType} content
   * @param {SourceType} _source
   */
  constructor(
    public readonly id: string,
    public readonly content: ContentType,
    private readonly _source: Amq.Message,
    private readonly _ack: (source: Amq.Message) => void,
    private readonly _reject: (source: Amq.Message, requeue: boolean) => void
  ) {}

  public ack(): void {
    return this._ack(this._source);
  }

  public reject(): void {
    return this._reject(this._source, false);
  }

  public postpone(): void {
    return this._reject(this._source, true);
  }
}
