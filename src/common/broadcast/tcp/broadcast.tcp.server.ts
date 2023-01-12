import { log } from '@alien-worlds/api-core';
import { createServer, Server, Socket } from 'net';
import {
  BroadcastClientConnectedData,
  BroadcastTcpSystemMessage,
  BroadcastTcpMessage,
  BroadcastTcpMessageContent,
  BroadcastTcpMessageType,
  BroadcastTcpSystemMessageType,
} from './broadcast.tcp.message';

export const getClientAddress = ({ remoteAddress, remotePort }: Socket) =>
  `${remoteAddress}:${remotePort}`;

export class SocketClient {
  private _address: string;
  constructor(public readonly socket: Socket, public readonly name: string) {
    this._address = `${socket.remoteAddress}:${socket.remotePort}`;
  }

  public get address(): string {
    return this._address;
  }
}

export class BroadcastTcpServer {
  private server: Server;
  private nameAtAddress: Map<string, string> = new Map();
  private clientsByChannel: Map<string, SocketClient[]> = new Map();

  constructor(private options: { port: number; host?: string }) {}

  private onClientConnected(socket: Socket, data: BroadcastClientConnectedData) {
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

  private onClientDisconnected(socket: Socket) {
    const address = getClientAddress(socket);
    if (this.nameAtAddress.has(address)) {
      this.nameAtAddress.delete(address);
    }

    this.clientsByChannel.forEach(clients => {
      const i = clients.findIndex(client => client.address === address);
      if (i > -1) {
        clients.splice(i, 1);
      }
    });

    log(`Broadcast TCP Server: client ${address} connection closed.`);
  }

  private onClientMessage(socket: Socket, message: BroadcastTcpMessage) {
    const {
      content: { channel, data },
    } = message;
    const clients = this.clientsByChannel.get(channel);

    if (clients?.length > 0) {
      clients.forEach(client => {
        client.socket.write(BroadcastTcpMessage.create(channel, data).toBuffer());
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

  private onClientError(socket: Socket, error: Error) {
    const address = getClientAddress(socket);
    if (this.nameAtAddress.has(address)) {
      this.nameAtAddress.delete(address);
    }
    log(`Broadcast TCP Server: client ${address} connection error: ${error.message}`);
  }

  private handleClientMessage(socket: Socket, buffer: Buffer) {
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
    const {
      options: { host, port },
    } = this;
    this.server = createServer();

    this.server.on('connection', socket => {
      socket.on('data', buffer => this.handleClientMessage(socket, buffer));
      socket.on('error', error => this.onClientError(socket, error));
      socket.once('close', () => this.onClientDisconnected(socket));
    });

    this.server.listen(this.options, () => {
      log(`Broadcast TCP Server: listening on ${host ?? ''}:${port}`);
    });
  }
}
