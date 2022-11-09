/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
    public readonly ack: () => void,
    public readonly reject: () => void,
    public readonly postpone: () => void
  ) {}

  // public ack(): void {
  //   return this._ack(this._source);
  // }

  // public reject(): void {
  //   return this._reject(this._source, false);
  // }

  // public postpone(): void {
  //   return this._reject(this._source, true);
  // }
}
