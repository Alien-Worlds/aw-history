import {
  BroadcastTcpMessage,
  BroadcastTcpMessageType,
} from '../common/broadcast/tcp/broadcast.tcp.message';
import { InternalBroadcastMessageName } from './internal-broadcast.enums';

export class InternalBroadcastMessage<
  DataType = unknown
> extends BroadcastTcpMessage<DataType> {
  public static create<DataType = unknown>(
    sender: string,
    channel: string,
    name: InternalBroadcastMessageName,
    data: DataType
  ) {
    return new InternalBroadcastMessage({
      sender,
      channel,
      name,
      type: BroadcastTcpMessageType.Data,
      data,
    });
  }
}
