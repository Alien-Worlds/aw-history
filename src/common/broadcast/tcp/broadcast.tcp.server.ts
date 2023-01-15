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
import {
  writeSocketBuffer,
  getTcpConnectionOptions,
  splitToMessageBuffers,
} from './broadcast.tcp.utils';

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
      client.socket.write(writeSocketBuffer(message));
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
    const address = getClientAddress(socket);
    let shouldStash = true;
    if (clients?.length > 0) {
      clients.forEach(client => {
        if (address !== client.address) {
          shouldStash = false;
          client.socket.write(
            writeSocketBuffer(new BroadcastTcpMessage(message.content))
          );
        }
      });
    }
    if (shouldStash) {
      socket.write(
        writeSocketBuffer(BroadcastTcpSystemMessage.createMessageNotDelivered(message))
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
        const buffers = splitToMessageBuffers(buffer);
        buffers.forEach(buffer => {
          this.handleClientMessage(socket, buffer);
        });
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
