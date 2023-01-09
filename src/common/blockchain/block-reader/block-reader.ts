/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { log } from '@alien-worlds/api-core';
import { Abi, AbiDto } from '../block-content';
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
import { BlockReaderMessage } from './models/block-reader.message';
import { GetBlocksAckRequest } from './models/get-blocks-ack.request';
import { GetBlocksRequest } from './models/get-blocks.request';
import { ReceivedBlock } from './models/received-block';

export abstract class BlockReader {
  public abstract readOneBlock(block: bigint, options?: BlockReaderOptions): void;

  public abstract readBlocks(
    startBlock: bigint,
    endBlock: bigint,
    options?: BlockReaderOptions
  ): void;
  public abstract connect(): Promise<void>;
  public abstract disconnect(): Promise<void>;
  public abstract onReceivedBlock(
    handler: (content: ReceivedBlock) => void | Promise<void>
  );
  public abstract onComplete(
    handler: (startBlock?: bigint, endBlock?: bigint) => void | Promise<void>
  );
  public abstract onError(handler: (error: Error) => void | Promise<void>);
  public abstract onWarning(handler: (...args: unknown[]) => void | Promise<void>);
  public abstract hasFinished(): boolean;
}

/* eslint-disable @typescript-eslint/no-unsafe-argument */

export class BlockReaderService implements BlockReader {
  private errorHandler: (error: Error) => void;
  private warningHandler: (...args: unknown[]) => void;
  private receivedBlockHandler: (content: ReceivedBlock) => Promise<void>;
  private blockRangeCompleteHandler: (
    startBlock: bigint,
    endBlock: bigint
  ) => Promise<void>;
  private blockRangeRequest: GetBlocksRequest;
  private abi: Abi;

  constructor(private source: BlockReaderSource) {
    this.source.onMessage(message => {
      this.onMessage(message).catch((error: Error) => {
        this.handleError(error);
      });
    });
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

  public onConnected({ data }: ConnectionChangeHandlerOptions) {
    log(`BlockReader plugin connected`);

    this.abi = Abi.fromDto(JSON.parse(data) as AbiDto);
  }

  public onDisconnected({ previousState }: ConnectionChangeHandlerOptions) {
    log(`BlockReader plugin disconnected`);
    if (previousState === BlockReaderConnectionState.Disconnecting) {
      this.abi = null;
    }
  }

  public async onMessage(dto: Uint8Array): Promise<void> {
    const { abi } = this;

    if (!abi) {
      this.handleError(new AbiNotFoundError());
      return;
    }

    const message = BlockReaderMessage.create(dto, abi.getTypesMap());

    if (message.isGetStatusResult) {
      // TODO: ?
    } else if (message.isGetBlocksResult) {
      await this.handleBlocksResultContent(message.content);
    } else {
      this.handleError(new UnhandledMessageTypeError(message.type));
    }
  }

  private async handleBlocksResultContent(result: ReceivedBlock) {
    const {
      blockRangeRequest: { startBlock, endBlock },
    } = this;
    const { thisBlock } = result;
    const { abi } = this;

    if (!abi) {
      this.handleError(new AbiNotFoundError());
      return;
    }

    try {
      if (thisBlock) {
        const isLast = thisBlock.blockNumber === endBlock - 1n;
        await this.receivedBlockHandler(result);

        // If received block is the last one call onComplete handler
        if (isLast) {
          await this.blockRangeCompleteHandler(startBlock, endBlock);
          this.blockRangeRequest = null;
        }
      } else {
        this.handleWarning(`the received message does not contain this_block`);
      }
      // State history plugs will answer every call of ack_request, even after
      // processing the full range, it will send messages containing only head.
      // After the block has been processed, the connection should be closed so
      // there is no need to ack request.
      if (this.source.isConnected) {
        // Acknowledge a request so that source can send next one.
        this.source.send(new GetBlocksAckRequest(1, abi.getTypesMap()).toUint8Array());
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
      log(`BlockReader plugin connecting...`);
      await this.source.connect();
    } else {
      log(`Service already connected`);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.source.isConnected) {
      log(`BlockReader plugin disconnecting...`);
      await this.source.disconnect();
    } else {
      log(`Service not connected`);
    }
  }

  public readOneBlock(block: bigint, options?: BlockReaderOptions): void {
    this.readBlocks(block, block + 1n, options);
  }

  public readBlocks(
    startBlock: bigint,
    endBlock: bigint,
    options?: BlockReaderOptions
  ): void {
    const requestOptions = options || {
      shouldFetchDeltas: true,
      shouldFetchTraces: true,
    };

    const { abi, receivedBlockHandler, source } = this;
    if (!receivedBlockHandler) {
      throw new MissingHandlersError();
    }
    log(`BlockReader plugin trying to request blocks`);
    // still processing block range request?
    if (this.blockRangeRequest) {
      throw new UnhandledBlockRequestError(startBlock, endBlock);
    }

    if (!abi) {
      throw new AbiNotFoundError();
    }

    this.blockRangeRequest = GetBlocksRequest.create(
      startBlock,
      endBlock,
      requestOptions,
      abi.getTypesMap()
    );
    source.send(this.blockRangeRequest.toUint8Array());
    log(`BlockReader plugin request sent`, { startBlock, endBlock });
  }

  public onReceivedBlock(handler: (content: ReceivedBlock) => Promise<void>) {
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

  public hasFinished(): boolean {
    return this.blockRangeRequest === null;
  }
}
