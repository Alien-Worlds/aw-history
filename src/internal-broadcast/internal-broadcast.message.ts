import {
  BroadcastTcpMessage,
  BroadcastTcpMessageType,
} from '../common/broadcast/tcp/broadcast.tcp.message';
import { InternalBroadcastMessageName } from './internal-broadcast.enums';

export class InternalBroadcastMessage<DataType = unknown> extends BroadcastTcpMessage<DataType> {
  public static create<DataType = unknown>(
    channel: string,
    name: InternalBroadcastMessageName,
    data: DataType
  ) {
    return new InternalBroadcastMessage({
      channel,
      name,
      type: BroadcastTcpMessageType.Data,
      data,
    });
  }
}
