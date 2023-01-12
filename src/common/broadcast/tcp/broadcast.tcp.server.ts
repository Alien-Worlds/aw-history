import { log } from '@alien-worlds/api-core';
import { createServer, Server, Socket } from 'net';
import { BroadcastConnectionConfig } from '../broadcast.types';
import {
  BroadcastClientConnectedData,
  BroadcastTcpSystemMessage,
  BroadcastTcpMessage,
  BroadcastTcpMessageType,
  BroadcastTcpSystemMessageType,
} from './broadcast.tcp.message';
import { getTcpConnectionOptions } from './broadcast.tcp.utils';

export const getClientAddress = ({ remoteAddress, remotePort }: Socket) =>
  `${remoteAddress}:${remotePort}`;

export class SocketClient {
  protected _address: string;
  constructor(public readonly socket: Socket, public readonly name: string) {
    this._address = `${socket.remoteAddress}:${socket.remotePort}`;
  }

  public get address(): string {
    return this._address;
  }
}

export class BroadcastTcpServer {
  protected server: Server;
  protected clientsByChannel: Map<string, SocketClient[]> = new Map();

  constructor(protected config: BroadcastConnectionConfig) {}

  protected onClientConnected(socket: Socket, data: BroadcastClientConnectedData) {
    const { name, channels } = data;
    const client = new SocketClient(socket, name);

    log(
      `Broadcast TCP Server: client ${client.address} (${client.name}) connection open.`
    );

    for (const channel of channels) {
      if (this.clientsByChannel.has(channel)) {
        this.clientsByChannel.get(channel).push(client);
      } else {
        this.clientsByChannel.set(channel, [client]);
      }
    }
  }

  protected onClientDisconnected(socket: Socket) {
    const address = getClientAddress(socket);

    this.clientsByChannel.forEach(clients => {
      const i = clients.findIndex(client => client.address === address);
      if (i > -1) {
        clients.splice(i, 1);
      }
    });

    log(`Broadcast TCP Server: client ${address} connection closed.`);
  }

  protected onClientMessage(socket: Socket, message: BroadcastTcpMessage) {
    const {
      content: { channel },
    } = message;
    const clients = this.clientsByChannel.get(channel);

    if (clients?.length > 0) {
      clients.forEach(client => {
        client.socket.write(
          new BroadcastTcpMessage(message.content).toBuffer()
        );
        socket.write(
          BroadcastTcpSystemMessage.create(
            BroadcastTcpSystemMessageType.MessageDelivered,
            message
          ).toBuffer()
        );
      });
    } else {
      socket.write(
        BroadcastTcpSystemMessage.create(
          BroadcastTcpSystemMessageType.MessageUndelivered,
          message
        ).toBuffer()
      );
      // message undelivered
    }
  }

  protected onClientError(socket: Socket, error: Error) {
    const address = getClientAddress(socket);
    this.clientsByChannel.forEach(clients => {
      const i = clients.findIndex(client => client.address === address);
      if (i > -1) {
        clients.splice(i, 1);
      }
    });
    log(`Broadcast TCP Server: client ${address} connection error: ${error.message}`);
  }

  protected handleClientMessage(socket: Socket, buffer: Buffer) {
    const message = BroadcastTcpMessage.fromBuffer(buffer);
    const {
      content: { type, data },
    } = message;
    if (type === BroadcastTcpMessageType.ClientConnected) {
      this.onClientConnected(socket, <BroadcastClientConnectedData>data);
    } else if (type === BroadcastTcpMessageType.Data) {
      this.onClientMessage(socket, message);
    }
  }

  public start() {
    this.server = createServer();

    this.server.on('connection', socket => {
      socket.on('data', buffer => this.handleClientMessage(socket, buffer));
      socket.on('error', error => this.onClientError(socket, error));
      socket.once('close', () => this.onClientDisconnected(socket));
    });

    const options = getTcpConnectionOptions(this.config);

    this.server.listen(options, () => {
      log(`Broadcast TCP Server: listening on ${JSON.stringify(options)}`);
    });
  }
}
