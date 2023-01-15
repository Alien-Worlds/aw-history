import { BroadcastTcpStash } from './broadcast.tcp.stash';
import { log } from '@alien-worlds/api-core';
import { createServer, Server, Socket } from 'net';
import { BroadcastConnectionConfig } from '../broadcast.types';
import {
  BroadcastTcpSystemMessage,
  BroadcastTcpMessage,
  BroadcastTcpMessageType,
  BroadcastTcpMessageName,
  BroadcastClientConnectedData,
  BroadcastMessageHandlerData,
} from './broadcast.tcp.message';
import { getTcpConnectionOptions } from './broadcast.tcp.utils';

export const getClientAddress = ({ remoteAddress, remotePort }: Socket) =>
  `${remoteAddress}:${remotePort}`;

export class SocketClient {
  protected _address: string;
  protected channels: Set<string> = new Set();

  constructor(public readonly socket: Socket, public readonly name: string) {
    this._address = getClientAddress(socket);
  }

  public get address(): string {
    return this._address;
  }

  public addChannel(channel: string): void {
    this.channels.add(channel);
  }

  public removeChannel(channel: string): void {
    this.channels.delete(channel);
  }
}

export class BroadcastTcpServer {
  protected server: Server;
  protected clients: SocketClient[] = [];
  protected clientsByChannel: Map<string, SocketClient[]> = new Map();
  protected stash: BroadcastTcpStash = new BroadcastTcpStash();

  constructor(protected config: BroadcastConnectionConfig) {}

  protected resendStashedMessages(client: SocketClient, channel: string) {
    const messages = this.stash.pop(channel);
    for (const message of messages) {
      client.socket.write(message.toBuffer());
    }
  }

  protected onClientConnected(socket: Socket, data: BroadcastClientConnectedData) {
    const { name, channels } = data;
    const address = getClientAddress(socket);
    let client = this.clients.find(client => client.address === address);

    if (!client) {
      client = new SocketClient(socket, name);
      this.clients.push(client);
    }

    log(
      `Broadcast TCP Server: client ${client.address} (${client.name}) connection open.`
    );

    for (const channel of channels) {
      if (this.clientsByChannel.has(channel)) {
        this.clientsByChannel.get(channel).push(client);
      } else {
        this.clientsByChannel.set(channel, [client]);
      }
      client.addChannel(channel);
      // if there are any undelivered messages, then send them
      // to the first client that listens to the selected channel
      this.resendStashedMessages(client, channel);
    }
  }

  protected onClientAddedMessageHandler(
    socket: Socket,
    data: BroadcastMessageHandlerData
  ) {
    const { channel } = data;
    const address = getClientAddress(socket);
    const client = this.clients.find(client => client.address === address);

    if (client) {
      log(
        `Broadcast TCP Server: client ${client.address} (${client.name}) is listening to channel "${channel}".`
      );

      if (this.clientsByChannel.has(channel)) {
        this.clientsByChannel.get(channel).push(client);
      } else {
        this.clientsByChannel.set(channel, [client]);
      }

      client.addChannel(channel);
    }
  }

  protected onClientRemovedMessageHandler(
    socket: Socket,
    data: BroadcastMessageHandlerData
  ) {
    const { channel } = data;
    const address = getClientAddress(socket);
    const client = this.clients.find(client => client.address === address);

    if (this.clientsByChannel.has(channel) && client) {
      log(
        `Broadcast TCP Server: client ${client.address} (${client.name}) has stopped listening to channel "${channel}".`
      );

      const clients = this.clientsByChannel.get(channel);
      const i = clients.findIndex(client => client.address === address);
      if (i > -1) {
        clients.splice(i, 1);
      }
      client.removeChannel(channel);
    }
  }

  protected onClientDisconnected(socket: Socket) {
    const address = getClientAddress(socket);
    const i = this.clients.findIndex(client => client.address === address);

    if (i) {
      this.clients.splice(i);
    }

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
        client.socket.write(new BroadcastTcpMessage(message.content).toBuffer());
        socket.write(
          BroadcastTcpSystemMessage.createMessageDelivered(message).toBuffer()
        );
      });
    } else {
      socket.write(
        BroadcastTcpSystemMessage.createMessageNotDelivered(message).toBuffer()
      );

      if (message.persistent) {
        this.stash.add(message);
      }
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
      content: { type, data, name },
    } = message;
    if (
      type === BroadcastTcpMessageType.System &&
      name === BroadcastTcpMessageName.ClientConnected
    ) {
      this.onClientConnected(socket, <BroadcastClientConnectedData>data);
    } else if (
      type === BroadcastTcpMessageType.System &&
      name === BroadcastTcpMessageName.ClientAddedMessageHandler
    ) {
      this.onClientAddedMessageHandler(socket, <BroadcastMessageHandlerData>data);
    } else if (
      type === BroadcastTcpMessageType.System &&
      name === BroadcastTcpMessageName.ClientRemovedMessageHandler
    ) {
      this.onClientRemovedMessageHandler(socket, <BroadcastMessageHandlerData>data);
    } else if (type === BroadcastTcpMessageType.Data) {
      this.onClientMessage(socket, message);
    }
  }

  public start() {
    this.server = createServer();

    this.server.on('connection', socket => {
      socket.on('data', buffer => {
        if (buffer.length > 2) {
          let offset = 0;
          while (offset < buffer.length) {
            const head = buffer.subarray(offset, offset + 2);
            const buffSize = head[0];
            const buffStart = offset + 2;
            const buffEnd = buffStart + buffSize;
            this.handleClientMessage(socket, buffer.subarray(buffStart, buffEnd));
            offset = buffEnd;
          }
        }
      });
      socket.on('error', error => this.onClientError(socket, error));
      socket.once('close', () => this.onClientDisconnected(socket));
    });

    const options = getTcpConnectionOptions(this.config);

    this.server.listen(options, () => {
      log(`Broadcast TCP Server: listening on ${JSON.stringify(options)}`);
    });
  }
}
