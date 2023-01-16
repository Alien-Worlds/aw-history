/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Serialize } from 'eosjs';
import { GetBlocksResultDto } from '../block-reader.dtos';
import { deserializeMessage } from '../block-reader.utils';
import { ReceivedBlock } from './received-block';

export class BlockReaderMessage<MessageContentType> {
  public static readonly version = 'v0';

  public static create(dto: Uint8Array, types: Map<string, Serialize.Type>) {
    const result = deserializeMessage('result', dto, types);
    let content: unknown;
    let type: string;

    if (result) {
      const [resultType, contentDto]: [string, unknown] = result;
      type = resultType;
      content = contentDto;

      if (resultType === `get_blocks_result_${this.version}`) {
        return new BlockReaderMessage<ReceivedBlock>(
          type,
          ReceivedBlock.create(<GetBlocksResultDto>content, types)
        );
      }
    }

    return null;
  }

  private constructor(
    public readonly type: string,
    public readonly content: MessageContentType
  ) {}
}
