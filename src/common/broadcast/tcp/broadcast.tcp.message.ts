import { nanoid } from 'nanoid';
import { deserialize, serialize } from 'v8';
import { BroadcastMessage } from '../broadcast.types';

export enum BroadcastTcpMessageType {
  Data = 'DATA',
  System = 'SYSTEM',
  ClientConnected = 'CLIENT_CONNECTED',
  ClientDisconnected = 'CLIENT_DISCONNECTED',
}

export enum BroadcastTcpMessageName {
  Unknown = 'UNKNOWN',
}

export enum BroadcastTcpSystemMessageType {
  MessageDelivered = 'MESSAGE_DELIVERED',
  MessageUndelivered = 'MESSAGE_UNDELIVERED',
}

export type BroadcastTcpMessageContent<DataType = unknown> = {
  channel: string;
  type: string;
  name: string;
  data: DataType;
};

export class BroadcastTcpMessage<ContentType = unknown> implements BroadcastMessage {
  public static fromBuffer<DataType = unknown>(
    buffer: Buffer
  ): BroadcastTcpMessage<DataType> {
    const content = deserialize(buffer) as BroadcastTcpMessageContent<DataType>;

    return new BroadcastTcpMessage(content);
  }

  public source: unknown;
  public id: string = nanoid();

  constructor(public readonly content: BroadcastTcpMessageContent<ContentType>) {}

  public toBuffer(): Buffer {
    return serialize(this.content);
  }
}

///

export type BroadcastClientConnectedData = {
  name: string;
  channels: string[];
};

export class BroadcastClientConnectedMessage extends BroadcastTcpMessage<BroadcastClientConnectedData> {
  public static create(name: string, channels: string[]) {
    return new BroadcastClientConnectedMessage({
      channel: null,
      name: BroadcastTcpMessageType.ClientConnected,
      type: BroadcastTcpMessageType.ClientConnected,
      data: { name, channels },
    });
  }
}

///

export type BroadcastClientDisonnectedData = {
  name: string;
};

export class BroadcastClientDisconnectedMessage extends BroadcastTcpMessage<BroadcastClientDisonnectedData> {
  public static create(name: string) {
    return new BroadcastClientDisconnectedMessage({
      channel: null,
      name: BroadcastTcpMessageType.ClientDisconnected,
      type: BroadcastTcpMessageType.ClientDisconnected,
      data: { name },
    });
  }
}

////

export type BroadcastSystemMessageData = {
  type: BroadcastTcpSystemMessageType;
  originMessage?: { id: string; content: BroadcastTcpMessageContent };
};

export class BroadcastTcpSystemMessage extends BroadcastTcpMessage<BroadcastSystemMessageData> {
  public static create(
    type: BroadcastTcpSystemMessageType,
    message?: BroadcastTcpMessage
  ) {
    return new BroadcastTcpSystemMessage({
      channel: null,
      name: BroadcastTcpMessageType.System,
      type: BroadcastTcpMessageType.System,
      data: { type, originMessage: message },
    });
  }
}
