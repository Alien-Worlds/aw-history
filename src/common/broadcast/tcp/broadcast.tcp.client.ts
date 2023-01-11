import { log } from '@alien-worlds/api-core';
import { createConnection, Socket } from 'net';
import { Broadcast, BroadcastMessage, MessageHandler } from '../broadcast.types';
import {
  BroadcastClientConnectedMessage,
  BroadcastTcpMessage,
} from './broadcast.tcp.message';

export class BroadcastTcpClient implements Broadcast {
  private client: Socket;
  constructor(
    public readonly name: string,
    private options: { port: number; host?: string }
  ) {}

  public async connect() {
    this.client = createConnection(this.options, () => {
      log(`Broadcast - ${this.name}: connected to the server.`);
      this.client.write(BroadcastClientConnectedMessage.create(this.name).toBuffer());
    });
    this.client.on('end', () => {
      log(`Broadcast - ${this.name}: disconnected from the server.`);
    });
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
    this.client.on('data', buffer => {
      const message = BroadcastTcpMessage.fromBuffer(buffer);

      if (channel === message.content.channel) {
        handler(message);
      }
    });
  }
}
