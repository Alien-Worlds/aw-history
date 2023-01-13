import { log } from '@alien-worlds/api-core';
import { Socket } from 'net';
import { wait } from '../../common.utils';
import { ConnectionState } from '../broadcast.enums';
import {
  Broadcast,
  BroadcastConnectionConfig,
  BroadcastMessage,
  MessageHandler,
} from '../broadcast.types';
import {
  BroadcastClientConnectedMessage,
  BroadcastTcpMessage,
  BroadcastTcpMessageName,
  BroadcastTcpMessageType,
  BroadcastTcpSystemMessage,
  BroadcastTcpSystemMessageType,
} from './broadcast.tcp.message';
import { getTcpConnectionOptions } from './broadcast.tcp.utils';

export class BroadcastTcpClient implements Broadcast {
  private client: Socket;
  private connectionOptions: { path?: string; host?: string; port?: number };
  private connectionState: ConnectionState = ConnectionState.Offline;
  private channelHandlers: Map<string, MessageHandler<BroadcastMessage>> = new Map();

  constructor(public readonly name: string, config: BroadcastConnectionConfig) {
    this.connectionOptions = getTcpConnectionOptions(config);
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
      const { path, port, host } = this.connectionOptions;
      this.client.connect({ path, port, host });
    }
  }

  public async sendMessage<DataType = unknown>(message: {
    channel: string;
    data?: DataType;
    name?: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const { channel, data, name } = message;
      this.client.write(
        new BroadcastTcpMessage({
          channel,
          type: BroadcastTcpMessageType.Data,
          name: name || BroadcastTcpMessageName.Unknown,
          data,
        }).toBuffer(),
        error => (error ? reject(error) : resolve())
      );
    });
  }

  public onMessage(channel: string, handler: MessageHandler<BroadcastMessage>): void {
    this.channelHandlers.set(channel, handler);
  }
}
