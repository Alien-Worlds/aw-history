/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { log } from '@alien-worlds/api-core';
import WebSocket from 'ws';
import { BlockReaderConfig } from './block-reader.config';
import { BlockReaderConnectionState } from './block-reader.enums';
import { ConnectionChangeHandler } from './block-reader.types';

export class BlockReaderSource {
  private messageHandler: (...args: unknown[]) => void;
  private errorHandler: (...args: unknown[]) => void;
  private client: WebSocket;
  private endpoint: string;
  private connectionState = BlockReaderConnectionState.Idle;
  private connectionChangeHandlers: Map<
    BlockReaderConnectionState,
    ConnectionChangeHandler
  > = new Map();
  private socketIndex = -1;
  private reconnectDelay;

  constructor(private readonly config: BlockReaderConfig) {}

  private async updateConnectionState(state: BlockReaderConnectionState, data?: string) {
    const previousState = state;
    this.connectionState = state;
    this.reconnectDelay = this.config.reconnectInterval || 1000;
    const handler = this.connectionChangeHandlers.get(state);
    if (handler) {
      return handler({ previousState, state, data });
    }
  }

  private getNextEndpoint() {
    let nextIndex = ++this.socketIndex;

    if (nextIndex >= this.config.endpoints.length) {
      nextIndex = 0;
    }
    this.socketIndex = nextIndex;

    return this.config.endpoints[this.socketIndex];
  }

  private waitUntilConnectionIsOpen() {
    log(`BlockReader plugin connecting to: ${this.endpoint}`);
    return new Promise(resolve => {
      this.client.once('open', () => {
        log(`BlockReader plugin connection open.`);
        resolve(true);
      });
    });
  }

  private async onConnectionClosed(code: number) {
    this.client = null;
    log(`BlockReader plugin connection closed with code #${code}.`);
    await this.updateConnectionState(BlockReaderConnectionState.Idle);
  }

  private receiveAbi() {
    return new Promise<string>(resolve => this.client.once('message', resolve));
  }

  public onError(handler: (error: Error) => void) {
    this.errorHandler = handler;
  }

  public onMessage(handler: (dto: Uint8Array) => void) {
    this.messageHandler = handler;
  }

  public addConnectionStateHandler(
    state: BlockReaderConnectionState,
    handler: ConnectionChangeHandler
  ) {
    if (this.connectionChangeHandlers.has(state)) {
      console.warn(`Overriding the handler assigned to the "${state}" state`);
    } else {
      this.connectionChangeHandlers.set(state, handler);
    }
  }

  public get isConnected() {
    return this.connectionState === BlockReaderConnectionState.Connected;
  }

  public async connect() {
    if (this.connectionState === BlockReaderConnectionState.Idle) {
      log(`BlockReader plugin connecting...`);
      try {
        await this.updateConnectionState(BlockReaderConnectionState.Connecting);
        this.endpoint = this.getNextEndpoint();
        this.client = new WebSocket(this.endpoint, {
          perMessageDeflate: false,
        });
        this.client.on('close', code => this.onConnectionClosed(code));
        this.client.on('error', error => this.errorHandler(error));
        await this.waitUntilConnectionIsOpen();
        // receive ABI - first message from WS is always ABI
        const abi = await this.receiveAbi();
        // set message handler
        this.client.on('message', message => this.messageHandler(message));

        await this.updateConnectionState(BlockReaderConnectionState.Connected, abi);
      } catch (error) {
        setTimeout(
          () => this.updateConnectionState(BlockReaderConnectionState.Idle),
          this.reconnectDelay
        );
        this.connectionState = BlockReaderConnectionState.Idle;
        this.errorHandler(error);
      }
    }
  }

  public async disconnect() {
    if (this.connectionState === BlockReaderConnectionState.Connected) {
      log(`BlockReader plugin disconnecting...`);
      try {
        await this.updateConnectionState(BlockReaderConnectionState.Disconnecting);
        this.client.removeAllListeners();
        this.client.close();
      } catch (error) {
        this.errorHandler(error);
      }
    }
  }

  public send(message: Uint8Array) {
    this.client.send(message);
  }
}
