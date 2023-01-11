/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { nanoid } from 'nanoid';
import { deserialize, serialize } from 'v8';
import { BroadcastMessage } from '../broadcast.types';

export enum BroadcastTcpMessageType {
  Default = 'DEFAULT',
  ClientConnected = 'CLIENT_CONNECTED',
  ClientDisconnected = 'CLIENT_DISCONNECTED',
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
    type: string = BroadcastTcpMessageType.Default
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

//

export type BroadcastClientConnectionData = {
  name: string;
};

export class BroadcastClientConnectedMessage
  implements BroadcastTcpMessage<BroadcastClientConnectionData>
{
  public static create(name: string) {
    return new BroadcastClientConnectedMessage({
      channel: null,
      type: BroadcastTcpMessageType.ClientConnected,
      data: { name },
    });
  }

  public source: unknown;
  public id: string = nanoid();

  protected constructor(
    public readonly content: BroadcastTcpMessageContent<BroadcastClientConnectionData>
  ) {}

  public toBuffer(): Buffer {
    return serialize(this.content);
  }
}

export class BroadcastClientDisconnectedMessage
  implements BroadcastTcpMessage<BroadcastClientConnectionData>
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
    public readonly content: BroadcastTcpMessageContent<BroadcastClientConnectionData>
  ) {}

  public toBuffer(): Buffer {
    return serialize(this.content);
  }
}
