import { Serialize } from 'eosjs';
import { BlockReaderOptions } from './block-reader.types';
import { serializeMessage } from './block-reader.utils';

export class GetBlocksRequest {
  public readonly version = 'v0';

  public static create(
    startBlock: bigint,
    endBlock: bigint,
    options: BlockReaderOptions,
    types: Map<string, Serialize.Type>
  ) {
    const { shouldFetchDeltas, shouldFetchTraces } = options;

    return new GetBlocksRequest(
      startBlock,
      endBlock,
      shouldFetchTraces,
      shouldFetchDeltas,
      types
    );
  }

  private constructor(
    public readonly startBlock: bigint,
    public readonly endBlock: bigint,
    public readonly shouldFetchTraces: boolean,
    public readonly shouldFetchDeltas: boolean,
    public readonly types: Map<string, Serialize.Type>
  ) {}

  public toUint8Array(): Uint8Array {
    return serializeMessage(
      'request',
      [
        `get_blocks_request_${this.version}`,
        {
          irreversible_only: false,
          start_block_num: Number(this.startBlock.toString()),
          end_block_num: Number(this.endBlock.toString()),
          max_messages_in_flight: 1,
          have_positions: [],
          fetch_block: true,
          fetch_traces: this.shouldFetchTraces,
          fetch_deltas: this.shouldFetchDeltas,
        },
      ],
      this.types
    );
  }
}

export class GetBlocksAckRequest {
  public readonly version = 'v0';

  constructor(
    public readonly messagesCount: number,
    public readonly types: Map<string, Serialize.Type>
  ) {}

  public toUint8Array() {
    return serializeMessage(
      'request',
      [`get_blocks_ack_request_${this.version}`, { num_messages: this.messagesCount }],
      this.types
    );
  }
}
