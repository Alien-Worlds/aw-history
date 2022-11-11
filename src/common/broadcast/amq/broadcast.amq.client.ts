/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import * as Amq from 'amqplib';
import { nanoid } from 'nanoid';
import {
  BroadcastError,
  BroadcastSendError,
  MapperNotFoundError,
} from '../broadcast.errors';
import {
  Broadcast,
  BroadcastMessage,
  BroadcastOptions,
  BroadcastMessageContentMapper,
} from '../broadcast.types';
import { wait } from '../broadcast.utils';

import { ConnectionStateHandler, MessageHandler } from '../broadcast.types';
import { log } from '@alien-worlds/api-core';
import { BroadcastAmqMessage } from './broadcast.amq.message';
import { ConnectionState } from '../broadcast.enums';

export type Ack = (message: Amq.Message) => void;
export type Reject = (message: Amq.Message, requeue: boolean) => void;

export type ConsumerOptions = {
  consumerTag?: string | undefined;
  noLocal?: boolean | undefined;
  noAck?: boolean | undefined;
  exclusive?: boolean | undefined;
  priority?: number | undefined;
  arguments?: unknown;
};

/**
 * @class
 */
export class BroadcastAmqClient implements Broadcast {
  private channel: Amq.Channel;
  private connection: Amq.Connection;
  private connectionErrorsCount: number;
  private maxConnectionErrors: number;
  private handlers: Map<string, MessageHandler<Amq.Message>[]>;
  private consumers: Map<string, ConsumerOptions>;
  private connectionStateHandlers: Map<ConnectionState, ConnectionStateHandler>;
  private initialized: boolean;
  private connectionState: ConnectionState;
  private connectionError: unknown;
  private errorHandler: (...args: unknown[]) => void;
  private sentHandler: (...args: unknown[]) => void;

  /**
   * @constructor
   * @param {string} address - connection string
   * @param {ChannelOptions} channelOptions - channel options
   * @param {Console} logger - logger instance
   */
  constructor(
    private address: string,
    public channelOptions: BroadcastOptions,
    private logger: Console
  ) {
    this.initialized = false;
    this.handlers = new Map<string, MessageHandler<Amq.Message>[]>();
    this.consumers = new Map<string, ConsumerOptions>();
    this.connectionStateHandlers = new Map<ConnectionState, ConnectionStateHandler>();
    this.connectionErrorsCount = 0;
    this.connectionState = ConnectionState.Offline;
    this.maxConnectionErrors = 5;
  }
  /**
   * Reconnect to server
   *
   * This function is called when the connection is closed.
   *
   * @private
   * @async
   */
  private async handleConnectionClose(): Promise<void> {
    if (this.connectionState === ConnectionState.Closing) {
      this.connectionState = ConnectionState.Offline;
      this.logger.warn(`process:${process.pid} |  Connection closed`);

      if (this.connectionStateHandlers.has(ConnectionState.Offline)) {
        await this.connectionStateHandlers.get(ConnectionState.Offline)();
      }

      await this.reconnect();
    }
  }

  /**
   * Logs a connection error and tries to reconnect.
   * This function is called when there is a connection error.
   *
   * @private
   * @async
   * @param {Error} error
   */
  private handleConnectionError(error: Error): void {
    if (error.message !== 'Connection closing') {
      this.connectionErrorsCount++;
      if (this.connectionErrorsCount > this.maxConnectionErrors) {
        this.logger.error('Connection Error', { e: error });
      } else {
        this.logger.warn('Connection Error', { e: error });
      }
    }
  }

  private async handleChannelCancel(reason) {
    if (this.connectionState === ConnectionState.Online) {
      await this.close(reason);
    }
  }

  private async handleChannelClose() {
    if (this.connectionState === ConnectionState.Online) {
      await this.close();
    }
  }

  private async handleChannelError(error) {
    if (this.connectionState === ConnectionState.Online) {
      await this.close(error);
    }
  }

  /**
   * Reconnect to server and reassign queue handlers.
   * This function is called when the connection is lost
   * due to an error or closure.
   *
   * After a failed connection attempt, the function calls
   * itself after a specified time.
   *
   * @private
   * @async
   */
  private async reconnect() {
    if (this.connectionState === ConnectionState.Offline) {
      this.initialized = false;
      log(`      >  Reloading connection with handlers`);

      try {
        await this.init();
        await this.reassignHandlers();
      } catch (error) {
        this.connectionState = ConnectionState.Offline;
        this.connectionErrorsCount++;
        const ms = Math.pow(this.connectionErrorsCount, 2) * 1000;
        await this.waitAndReconnect(ms);
      }
    }
  }

  /**
   * Wait for the specified time and reconnect.
   * (Written to facilitate unit testing)
   *
   * @param {number} ms
   */
  private async waitAndReconnect(ms: number) {
    await wait(ms);
    await this.reconnect();
  }
  /**
   * Parse buffer to message content and execute message handler
   *
   * @param {Amq.Message} message
   * @param {MessageHandler<BroadcastMessage>} handler
   * @param {BroadcastMessageContentMapper} mapper
   * @param {Console} logger
   */
  private async executeMessageHandler(
    message: Amq.Message,
    handler: MessageHandler<BroadcastMessage>,
    mapper: BroadcastMessageContentMapper,
    logger: Console
  ): Promise<void> {
    const {
      properties: { messageId },
      content,
    } = message;
    const data = await mapper.toContent(content).catch(error => logger.error(error));
    let broadcastMessage = new BroadcastAmqMessage(
      messageId,
      data,
      () => this.channel.ack(message),
      () => this.channel.reject(message, false),
      () => this.channel.reject(message, true)
    );
    handler(broadcastMessage).catch(error => logger.error(error));
    broadcastMessage = null;
  }

  /**
   * Reassign queue handlers stored in the 'handlers' map.
   * This function is called when the connection is restored
   *
   * @private
   * @async
   */
  private async reassignHandlers(): Promise<void> {
    const promises = [];
    this.handlers.forEach((handlers: MessageHandler<Amq.Message>[], queue: string) => {
      handlers.forEach(handler => promises.push(this.onMessage(queue, handler)));
    });
    await Promise.all(promises);
  }

  /**
   * Create channel and set up queues.
   *
   * @private
   * @async
   */
  private async createChannel(): Promise<void> {
    const { prefetch, queues } = this.channelOptions;
    this.channel = await this.connection.createChannel();
    this.channel.on('cancel', async data => this.handleChannelCancel(data));
    this.channel.on('close', async () => this.handleChannelClose());
    this.channel.on('error', async error => this.handleChannelError(error));
    log(`      >  Channel created.`);

    await this.channel.prefetch(prefetch);
    for (const queue of queues) {
      await this.channel.assertQueue(queue.name, queue.options);
    }

    log(`      >  Queues set up.`);
  }

  /**
   * Connect to server
   *
   * @private
   * @async
   */
  private async connect(): Promise<void> {
    if (this.connectionState !== ConnectionState.Offline) {
      return;
    }
    this.connectionState = ConnectionState.Connecting;
    this.connection = await Amq.connect(this.address);
    this.connection.on('error', (error: Error) => {
      this.handleConnectionError(error);
    });
    this.connection.on('close', async () => {
      await this.handleConnectionClose();
    });
    this.connectionState = ConnectionState.Online;

    log(`      >  Connected to AMQ ${this.address}`);
  }

  /**
   * Close connection
   *
   * @param {unknown} reason
   */
  public async close(reason?: unknown): Promise<void> {
    if (this.connectionState === ConnectionState.Online) {
      this.connectionState = ConnectionState.Closing;
      if (reason) {
        this.connectionError = reason;
      }
      await this.connection.close();

      log(`      >  Disconnected from AMQ ${this.address}`);
    }
  }

  /**
   * Initialize driver
   *
   * @async
   */
  public async init(): Promise<void> {
    if (!this.initialized) {
      await this.connect();
      await this.createChannel();

      this.initialized = true;
      this.connectionErrorsCount = 0;
    }
  }

  /**
   * Send a single message with the content given as a buffer to the specific queue named, bypassing routing.
   *
   * @async
   * @param {string} queue
   * @param {Buffer} message
   */
  public async sendMessage(name: string, message: unknown): Promise<void> {
    const { mapper } =
      this.channelOptions.queues.find(queue => queue.name === name) || {};

    let error: Error;
    let success: boolean;

    if (mapper) {
      success = await this.channel.sendToQueue(name, mapper.toBuffer(message), {
        deliveryMode: true,
        messageId: nanoid(),
      });
    } else {
      error = new MapperNotFoundError(name);
      success = false;
    }

    if (!success && this.errorHandler) {
      this.errorHandler(new BroadcastSendError(error));
    } else if (success && this.sentHandler) {
      this.sentHandler();
    }
  }

  public onError(handler: (error: BroadcastError) => void) {
    this.errorHandler = handler;
  }

  public onMessageSent(handler: (...args: unknown[]) => void) {
    this.sentHandler = handler;
  }

  /**
   * Set up a listener for the queue.
   *
   * @param {string} queue - queue name
   * @param {MessageHandler} handler - queue handler
   */
  public async onMessage(
    name: string,
    handler: MessageHandler<BroadcastMessage>
  ): Promise<void> {
    try {
      const logger = this.logger;
      const { mapper, fireAndForget } =
        this.channelOptions.queues.find(queue => queue.name === name) || {};

      if (!mapper) {
        throw new MapperNotFoundError(name);
      }
      //
      if (this.handlers.has(name)) {
        this.handlers.get(name).push(handler);
      } else {
        this.handlers.set(name, [handler]);
      }
      //
      if (this.consumers.has(name)) {
        this.consumers.delete(name);
      }
      //
      const consumerOptions = await this.channel.consume(
        name,
        async (message: Amq.Message) =>
          this.executeMessageHandler(message, handler, mapper, logger),
        {
          noAck: Boolean(fireAndForget),
        }
      );
      this.consumers.set(name, consumerOptions);
    } catch (error) {
      console.log(error);
      this.logger.error(`Failed to add listener`, error);
    }
  }

  public cancel(): void {
    this.consumers.forEach(options => {
      if (options.consumerTag) {
        this.channel.cancel(options.consumerTag);
      }
    });
    this.consumers.clear();
  }

  public resume(): Promise<void> {
    return this.reassignHandlers();
  }

  /**
   * Acknowledge the message.
   *
   * @param {Message} message
   */
  public ack(message: Amq.Message): void {
    try {
      this.channel.ack(message);
    } catch (error) {
      this.logger.error(`Failed to ack message`, error);
    }
  }

  /**
   * Reject a message.
   * Negative acknowledgement - set a message as not delivered and should be discarded.
   *
   * @param {Message} message
   */
  public reject(message: Amq.Message, requeue = true): void {
    try {
      this.channel.reject(message, requeue);
    } catch (error) {
      this.logger.error(`Failed to reject message`, error);
    }
  }

  /**
   *
   * @param {ConnectionState} state
   * @param {ConnectionStateHandler} handler
   */
  public addConnectionStateHandler(
    state: ConnectionState,
    handler: ConnectionStateHandler
  ): void {
    if (this.connectionStateHandlers.has(state)) {
      this.logger.warn(`Overwriting connection state: ${state} handler`);
    }
    this.connectionStateHandlers.set(state, handler);
  }

  /**
   *
   * @param {ConnectionState} state
   */
  public removeConnectionStateHandlers(state?: ConnectionState): void {
    if (state) {
      this.connectionStateHandlers.delete(state);
    } else {
      this.connectionStateHandlers.clear();
    }
  }
}
