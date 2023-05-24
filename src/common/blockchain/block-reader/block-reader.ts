/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { MongoSource, log } from '@alien-worlds/api-core';
import { BlockReaderConfig } from './block-reader.config';
import { BlockReaderConnectionState } from './block-reader.enums';
import {
  AbiNotFoundError,
  MissingHandlersError,
  UnhandledMessageError,
  UnhandledMessageTypeError,
} from './block-reader.errors';
import { BlockReaderSource } from './block-reader.source';
import { BlockReaderOptions, ConnectionChangeHandlerOptions } from './block-reader.types';
import { BlockReaderMessage } from './block-reader.message';
import { GetBlocksAckRequest, GetBlocksRequest } from './block-reader.requests';
import { Block } from './block/block';
import { ShipAbiSource } from '../../ship/ship-abi.source';
import { Abi, AbiJson } from '../abi';

export class BlockReader {
  public static async create(config: BlockReaderConfig): Promise<BlockReader> {
    const mongoSource = await MongoSource.create(config.mongo);
    const shipAbiSource = new ShipAbiSource(mongoSource);
    const source = new BlockReaderSource(config);
    source.onError(error => log(error));

    return new BlockReader(source, shipAbiSource);
  }

  private errorHandler: (error: Error) => void;
  private warningHandler: (...args: unknown[]) => void;
  private receivedBlockHandler: (content: Block) => Promise<void> | void;
  private blockRangeCompleteHandler: (
    startBlock: bigint,
    endBlock: bigint
  ) => Promise<void>;
  private _blockRangeRequest: GetBlocksRequest;
  private _abi: Abi;
  private _paused = false;
  private isLastBlock = false;

  constructor(private source: BlockReaderSource, private shipAbi: ShipAbiSource) {
    this.source.onMessage(message => this.onMessage(message));
    this.source.onError(error => {
      this.handleError(error);
    });
    this.source.addConnectionStateHandler(BlockReaderConnectionState.Connected, options =>
      this.onConnected(options)
    );
    this.source.addConnectionStateHandler(BlockReaderConnectionState.Idle, options =>
      this.onDisconnected(options)
    );
  }

  private async onConnected({ data }: ConnectionChangeHandlerOptions) {
    log(`BlockReader plugin connected`);

    const abi = Abi.fromJson(JSON.parse(data) as AbiJson);
    if (abi) {
      const result = await this.shipAbi.getAbi(abi.version);

      if (result.isFailure) {
        await this.shipAbi.updateAbi(abi);
      }
      this._abi = abi;
    }
  }

  private onDisconnected({ previousState }: ConnectionChangeHandlerOptions) {
    log(`BlockReader plugin disconnected`);
    if (previousState === BlockReaderConnectionState.Disconnecting) {
      this._abi = null;
    }
    this.connect();
  }

  public get abi(): Abi {
    return this._abi;
  }

  public onMessage(dto: Uint8Array): Promise<void> {
    const { abi } = this;

    if (!abi) {
      this.handleError(new AbiNotFoundError());
      return;
    }

    const message = BlockReaderMessage.create(dto, abi);

    if (message && message.isPongMessage === false) {
      this.handleBlocksResultContent(message.content);
    } else if (!message) {
      this.handleError(new UnhandledMessageTypeError(message.type));
    }
  }

  private async handleBlocksResultContent(result: Block) {
    const { thisBlock } = result;
    const { abi } = this;

    // skip any extra result messages
    if (this.isLastBlock) {
      return;
    }

    if (!abi) {
      this.handleError(new AbiNotFoundError());
      return;
    }

    try {
      if (thisBlock) {
        const {
          _blockRangeRequest: { startBlock, endBlock },
        } = this;
        this.isLastBlock = thisBlock.blockNumber === endBlock - 1n;

        if (this.isLastBlock) {
          await this.receivedBlockHandler(result);
          this.blockRangeCompleteHandler(startBlock, endBlock);
        } else {
          this.receivedBlockHandler(result);
          // State history plugs will answer every call of ack_request, even after
          // processing the full range, it will send messages containing only head.
          // After the block has been processed, the connection should be closed so
          // there is no need to ack request.
          if (this.source.isConnected && this._paused === false) {
            // Acknowledge a request so that source can send next one.
            this.source.send(
              new GetBlocksAckRequest(1, abi.getTypesMap()).toUint8Array()
            );
          }
        }
      } else {
        this.handleWarning(`the received message does not contain this_block`);
      }
    } catch (error) {
      this.handleError(new UnhandledMessageError(result, error));
    }
  }

  private handleError(error: Error) {
    if (this.errorHandler) {
      return this.errorHandler(error);
    }
  }

  private handleWarning(...args: unknown[]) {
    if (this.warningHandler) {
      return this.warningHandler(...args);
    }
  }

  public async connect(): Promise<void> {
    if (this.source.isConnected === false) {
      await this.source.connect();
    } else {
      log(`Service already connected`);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.source.isConnected) {
      await this.source.disconnect();
    } else {
      log(`Service not connected`);
    }
  }

  public pause(): void {
    if (this._paused === false) {
      this._paused = true;
    }
  }

  public resume(): void {
    if (this._paused && !this.isLastBlock) {
      this._paused = false;
      this.source.send(new GetBlocksAckRequest(1, this.abi.getTypesMap()).toUint8Array());
    }
  }

  public readBlocks(
    startBlock: bigint,
    endBlock: bigint,
    options?: BlockReaderOptions
  ): void {
    this.sendRequest(startBlock, endBlock, options);
    log(`BlockReader plugin: read blocks`, { startBlock, endBlock });
  }

  public readOneBlock(block: bigint, options?: BlockReaderOptions): void {
    this.sendRequest(block, block + 1n, options);
    log(`BlockReader plugin: read single block ${block}`);
  }

  private sendRequest(
    startBlock: bigint,
    endBlock: bigint,
    options?: BlockReaderOptions
  ): void {
    const requestOptions = options || {
      shouldFetchDeltas: true,
      shouldFetchTraces: true,
    };

    this.isLastBlock = false;
    this.resume();

    const { abi, receivedBlockHandler, source } = this;
    if (!receivedBlockHandler) {
      throw new MissingHandlersError();
    }

    if (!abi) {
      throw new AbiNotFoundError();
    }

    this._blockRangeRequest = GetBlocksRequest.create(
      startBlock,
      endBlock,
      requestOptions,
      abi.getTypesMap()
    );
    source.send(this._blockRangeRequest.toUint8Array());
  }

  public onReceivedBlock(handler: (content: Block) => Promise<void> | void) {
    this.receivedBlockHandler = handler;
  }

  public onComplete(handler: (startBlock: bigint, endBlock: bigint) => Promise<void>) {
    this.blockRangeCompleteHandler = handler;
  }

  public onError(handler: (error: Error) => void) {
    this.errorHandler = handler;
  }

  public onWarning(handler: (...args: unknown[]) => void) {
    this.warningHandler = handler;
  }
}
