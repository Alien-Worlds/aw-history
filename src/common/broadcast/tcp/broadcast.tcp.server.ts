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
  getClientAddress,
} from './broadcast.tcp.utils';
import { SocketClient } from './broadcast.tcp.client';
import { BroadcastTcpChannel } from './broadcast.tcp.channel';

export class BroadcastTcpServer {
  protected server: Server;
  protected clients: SocketClient[] = [];
  protected channelsByName: Map<string, BroadcastTcpChannel> = new Map();
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
      if (this.channelsByName.has(channel)) {
        this.channelsByName.get(channel).addClient(client);
      } else {
        this.channelsByName.set(channel, new BroadcastTcpChannel(channel, [client]));
      }
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

      if (this.channelsByName.has(channel)) {
        this.channelsByName.get(channel).addClient(client);
      } else {
        this.channelsByName.set(channel, new BroadcastTcpChannel(channel, [client]));
      }
      // if there are any undelivered messages, then send them
      // to the first client that listens to the selected channel
      this.resendStashedMessages(client, channel);
    }
  }

  protected onClientRemovedMessageHandler(
    socket: Socket,
    data: BroadcastMessageHandlerData
  ) {
    const { channel } = data;
    const address = getClientAddress(socket);
    const client = this.clients.find(client => client.address === address);

    if (this.channelsByName.has(channel) && client) {
      log(
        `Broadcast TCP Server: client ${client.address} (${client.name}) has stopped listening to channel "${channel}".`
      );
      this.channelsByName.get(channel).removeClient(address);
    }
  }

  protected onClientDisconnected(socket: Socket) {
    const address = getClientAddress(socket);
    const i = this.clients.findIndex(client => client.address === address);

    if (i) {
      this.clients.splice(i);
    }

    this.channelsByName.forEach(channel => {
      channel.removeClient(address);
    });

    log(`Broadcast TCP Server: client ${address} connection closed.`);
  }

  protected onClientMessage(socket: Socket, message: BroadcastTcpMessage) {
    const { content } = message;
    let success = false;

    if (this.channelsByName.has(content.channel)) {
      const channel = this.channelsByName.get(content.channel);
      const address = getClientAddress(socket);
      success = channel.sendMessage(new BroadcastTcpMessage(content), [address]);
    }

    if (!success) {
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
    this.channelsByName.forEach(channel => {
      channel.removeClient(address);
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

  protected add;

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
