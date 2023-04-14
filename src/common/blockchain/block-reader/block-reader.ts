/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { log } from '@alien-worlds/api-core';
import { Serialize } from 'eosjs';
import { Abi, AbiJson } from '../block-content';
import { BlockReaderConfig } from './block-reader.config';
import { BlockReaderConnectionState } from './block-reader.enums';
import {
  AbiNotFoundError,
  MissingHandlersError,
  UnhandledBlockRequestError,
  UnhandledMessageError,
  UnhandledMessageTypeError,
} from './block-reader.errors';
import { BlockReaderSource } from './block-reader.source';
import { BlockReaderOptions, ConnectionChangeHandlerOptions } from './block-reader.types';
import { BlockReaderMessage } from './block-reader.message';
import { GetBlocksAckRequest, GetBlocksRequest } from './block-reader.requests';
import { Block } from '../../../reader/blocks/block';

export class BlockReader {
  public static async create(config: BlockReaderConfig): Promise<BlockReader> {
    const source = new BlockReaderSource(config);
    source.onError(error => log(error));

    return new BlockReader(source);
  }

  private errorHandler: (error: Error) => void;
  private warningHandler: (...args: unknown[]) => void;
  private receivedBlockHandler: (content: Block) => Promise<void> | void;
  private blockRangeCompleteHandler: (
    startBlock: bigint,
    endBlock: bigint
  ) => Promise<void>;
  private _blockRangeRequest: GetBlocksRequest;
  private _typesMap: Map<string, Serialize.Type>;
  private _abi: Abi;

  constructor(private source: BlockReaderSource) {
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

  private onConnected({ data }: ConnectionChangeHandlerOptions) {
    log(`BlockReader plugin connected`);

    const abi = Abi.fromJson(JSON.parse(data) as AbiJson);
    if (abi) {
      this._abi = abi;
    }
  }

  private onDisconnected({ previousState }: ConnectionChangeHandlerOptions) {
    log(`BlockReader plugin disconnected`);
    if (previousState === BlockReaderConnectionState.Disconnecting) {
      this._typesMap = null;
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

    if (message) {
      this.handleBlocksResultContent(message.content);
    } else {
      this.handleError(new UnhandledMessageTypeError(message.type));
    }
  }

  private async handleBlocksResultContent(result: Block) {
    const { thisBlock } = result;
    const { _typesMap: typesMap } = this;

    if (!typesMap) {
      this.handleError(new AbiNotFoundError());
      return;
    }

    try {
      if (thisBlock) {
        const {
          _blockRangeRequest: { startBlock, endBlock },
        } = this;
        const isLast = thisBlock.blockNumber === endBlock - 1n;

        if (isLast) {
          await this.receivedBlockHandler(result);
          this.blockRangeCompleteHandler(startBlock, endBlock);
        } else {
          this.receivedBlockHandler(result);
          // State history plugs will answer every call of ack_request, even after
          // processing the full range, it will send messages containing only head.
          // After the block has been processed, the connection should be closed so
          // there is no need to ack request.
          if (this.source.isConnected) {
            // Acknowledge a request so that source can send next one.
            this.source.send(new GetBlocksAckRequest(1, typesMap).toUint8Array());
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
    if (!this.source.isConnected) {
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

    const { _typesMap: typesMap, receivedBlockHandler, source } = this;
    if (!receivedBlockHandler) {
      throw new MissingHandlersError();
    }
    // still processing block range request?
    if (this._blockRangeRequest) {
      throw new UnhandledBlockRequestError(startBlock, endBlock);
    }

    if (!typesMap) {
      throw new AbiNotFoundError();
    }

    this._blockRangeRequest = GetBlocksRequest.create(
      startBlock,
      endBlock,
      requestOptions,
      typesMap
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
