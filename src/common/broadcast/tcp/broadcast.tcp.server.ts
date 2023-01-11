import { log } from '@alien-worlds/api-core';
import { createServer, Server, Socket } from 'net';
import {
  BroadcastClientConnectionData,
  BroadcastTcpMessage,
  BroadcastTcpMessageType,
} from './broadcast.tcp.message';

export const getClientAddress = ({ remoteAddress, remotePort }: Socket) =>
  `${remoteAddress}:${remotePort}`;

export class BroadcastTcpServer {
  private server: Server;
  private clients: Map<string, string> = new Map();

  constructor(private options: { port: number; host?: string }) {}

  private onClientConnected(socket: Socket, data: BroadcastClientConnectionData) {
    const address = getClientAddress(socket);
    log(`Broadcast TCP Server: client ${address} (${data.name}) connection open.`);
    this.clients.set(address, data.name);
  }

  private onClientDisconnected(socket: Socket) {
    const address = getClientAddress(socket);
    if (this.clients.has(address)) {
      this.clients.delete(address);
    }
    log(`Broadcast TCP Server: client ${address} connection closed.`);
  }

  private onClientError(socket: Socket, error: Error) {
    const address = getClientAddress(socket);
    if (this.clients.has(address)) {
      this.clients.delete(address);
    }
    log(`Broadcast TCP Server: client ${address} connection error: ${error.message}`);
  }

  private handleClientMessage(socket: Socket, buffer: Buffer) {
    const {
      content: { type, data },
    } = BroadcastTcpMessage.fromBuffer(buffer);
    if (type === BroadcastTcpMessageType.ClientConnected) {
      this.onClientConnected(socket, <BroadcastClientConnectionData>data);
    } else {
      //
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
