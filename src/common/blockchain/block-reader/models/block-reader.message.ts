/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Serialize } from 'eosjs';
import { GetBlocksResultDto } from '../block-reader.dtos';
import { deserializeMessage } from '../block-reader.utils';
import { ReceivedBlock } from './received-block';

export class BlockReaderMessage<MessageContentType> {
  public readonly version = 'v0';

  public static create(dto: Uint8Array, types: Map<string, Serialize.Type>) {
    const result = deserializeMessage('result', dto, types);
    let content: ReceivedBlock;
    let type: string;

    if (result) {
      const [resultType, contentDto]: [string, GetBlocksResultDto] = result;
      content = ReceivedBlock.create(contentDto, types);
      type = resultType;
    }

    return new BlockReaderMessage<ReceivedBlock>(type, content);
  }

  private constructor(
    public readonly type: string,
    public readonly content: MessageContentType
  ) {}

  get isGetStatusResult() {
    return this.type === `get_status_result_${this.version}`;
  }

  get isGetBlocksResult() {
    return this.type === `get_blocks_result_${this.version}`;
  }
}
