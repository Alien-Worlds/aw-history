import {
  BroadcastTcpMessage,
  BroadcastTcpMessageType,
} from '../common/broadcast/tcp/broadcast.tcp.message';
import { InternalBroadcastMessageName } from './internal-broadcast.enums';

export class InternalBroadcastMessage extends BroadcastTcpMessage<unknown> {
  public static create(
    channel: string,
    name: InternalBroadcastMessageName,
    data: unknown
  ) {
    return new InternalBroadcastMessage({
      channel,
      name,
      type: BroadcastTcpMessageType.Data,
      data,
    });
  }
}
