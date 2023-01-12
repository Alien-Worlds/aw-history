import { log } from '@alien-worlds/api-core';
import { Socket } from 'net';
import { ConnectionState } from '../broadcast.enums';
import { Broadcast, BroadcastMessage, MessageHandler } from '../broadcast.types';
import { wait } from '../broadcast.utils';
import {
  BroadcastClientConnectedMessage,
  BroadcastTcpMessage,
  BroadcastTcpMessageType,
  BroadcastTcpSystemMessage,
  BroadcastTcpSystemMessageType,
} from './broadcast.tcp.message';

export class BroadcastTcpClient implements Broadcast {
  private client: Socket;
  private connectionState: ConnectionState = ConnectionState.Offline;
  private channelHandlers: Map<string, MessageHandler<BroadcastMessage>> = new Map();

  constructor(
    public readonly name: string,
    private options: { port: number; host?: string }
  ) {
    this.client = new Socket();
    this.client.on('connect', () => {
      this.connectionState = ConnectionState.Online;

      log(`Broadcast - ${this.name}: connected to the server.`);

      this.client.write(
        BroadcastClientConnectedMessage.create(
          this.name,
          Array.from(this.channelHandlers.keys())
        ).toBuffer()
      );
    });
    this.client.on('end', () => {
      this.connectionState = ConnectionState.Offline;
      log(`Broadcast - ${this.name}: disconnected from the server.`);
      this.reconnect();
    });
    this.client.on('error', error => {
      this.connectionState = ConnectionState.Offline;
      log(`Broadcast - ${this.name}: Error: ${error.message}`);
      this.reconnect();
    });
    this.client.on('data', buffer => {
      const message = BroadcastTcpMessage.fromBuffer(buffer);
      const {
        content: { type, channel },
      } = message;

      if (type === BroadcastTcpMessageType.System) {
        this.onSystemMessage(<BroadcastTcpSystemMessage>message);
      } else {
        const handler = this.channelHandlers.get(channel);
        if (handler) {
          handler(message);
        }
      }
    });
  }

  private onSystemMessage(message: BroadcastTcpSystemMessage) {
    const {
      content: {
        data: { type, originMessage },
      },
    } = message;
    const messageInfo = originMessage
      ? `id: ${originMessage.id}, channel: ${originMessage.content.channel}`
      : `unknown`;
    if (type === BroadcastTcpSystemMessageType.MessageUndelivered) {
      log(`Broadcast - ${this.name}: message (${messageInfo}) was not delivered.`);
    } else {
      // log(`Broadcast - ${this.name}: message (${messageInfo}) was delivered.`);
    }
  }

  private async reconnect() {
    if (this.connectionState === ConnectionState.Offline) {
      await wait(5000);
      this.connect();
    }
  }

  public connect() {
    if (this.connectionState === ConnectionState.Offline) {
      this.connectionState = ConnectionState.Connecting;
      this.client.connect(this.options);
    }
  }

  public async sendMessage<DataType = unknown>(
    channel: string,
    data: DataType
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.write(
        BroadcastTcpMessage.create<DataType>(channel, data).toBuffer(),
        error => (error ? reject(error) : resolve())
      );
    });
  }

  public onMessage(channel: string, handler: MessageHandler<BroadcastMessage>): void {
    this.channelHandlers.set(channel, handler);
  }
}
