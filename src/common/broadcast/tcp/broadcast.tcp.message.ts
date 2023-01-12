/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { nanoid } from 'nanoid';
import { deserialize, serialize } from 'v8';
import { BroadcastMessage } from '../broadcast.types';

export enum BroadcastTcpMessageType {
  Data = 'DATA',
  System = 'SYSTEM',
  ClientConnected = 'CLIENT_CONNECTED',
  ClientDisconnected = 'CLIENT_DISCONNECTED',
}

export enum BroadcastTcpSystemMessageType {
  MessageDelivered = 'MESSAGE_DELIVERED',
  MessageUndelivered = 'MESSAGE_UNDELIVERED',
}

export type BroadcastTcpMessageContent<DataType = unknown> = {
  channel: string;
  type: string;
  data: DataType;
};

export class BroadcastTcpMessage<ContentType = unknown> implements BroadcastMessage {
  public static fromBuffer<DataType = unknown>(
    buffer: Buffer
  ): BroadcastTcpMessage<DataType> {
    const content = deserialize(buffer) as BroadcastTcpMessageContent<DataType>;

    return new BroadcastTcpMessage(content);
  }

  public static create<DataType = unknown>(
    channel: string,
    data: DataType,
    type: string = BroadcastTcpMessageType.Data
  ) {
    return new BroadcastTcpMessage({ channel, type, data });
  }

  public source: unknown;
  public id: string = nanoid();

  protected constructor(
    public readonly content: BroadcastTcpMessageContent<ContentType>
  ) {}

  public toBuffer(): Buffer {
    return serialize(this.content);
  }
}

///

export type BroadcastClientConnectedData = {
  name: string;
  channels: string[];
};

export class BroadcastClientConnectedMessage
  implements BroadcastTcpMessage<BroadcastClientConnectedData>
{
  public static create(name: string, channels: string[]) {
    return new BroadcastClientConnectedMessage({
      channel: null,
      type: BroadcastTcpMessageType.ClientConnected,
      data: { name, channels },
    });
  }

  public source: unknown;
  public id: string = nanoid();

  protected constructor(
    public readonly content: BroadcastTcpMessageContent<BroadcastClientConnectedData>
  ) {}

  public toBuffer(): Buffer {
    return serialize(this.content);
  }
}

///

export type BroadcastClientDisonnectedData = {
  name: string;
};

export class BroadcastClientDisconnectedMessage
  implements BroadcastTcpMessage<BroadcastClientDisonnectedData>
{
  public static create(name: string) {
    return new BroadcastClientDisconnectedMessage({
      channel: null,
      type: BroadcastTcpMessageType.ClientDisconnected,
      data: { name },
    });
  }

  public source: unknown;
  public id: string = nanoid();

  protected constructor(
    public readonly content: BroadcastTcpMessageContent<BroadcastClientDisonnectedData>
  ) {}

  public toBuffer(): Buffer {
    return serialize(this.content);
  }
}

////

export type BroadcastSystemMessageData = {
  type: BroadcastTcpSystemMessageType;
  originMessage?: { id: string; content: BroadcastTcpMessageContent };
};

export class BroadcastTcpSystemMessage implements BroadcastTcpMessage {
  public static create(
    type: BroadcastTcpSystemMessageType,
    message?: BroadcastTcpMessage
  ) {
    return new BroadcastTcpSystemMessage({
      channel: null,
      type: BroadcastTcpMessageType.System,
      data: { type, originMessage: message },
    });
  }

  public source: unknown;
  public id: string = nanoid();

  protected constructor(
    public readonly content: BroadcastTcpMessageContent<BroadcastSystemMessageData>
  ) {}

  public toBuffer(): Buffer {
    return serialize(this.content);
  }
}
