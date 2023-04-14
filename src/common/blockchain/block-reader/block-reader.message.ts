/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { deserializeMessage } from './block-reader.utils';
import { Block } from '../../../reader/blocks/block';
import { BlockJson } from './block-reader.types';
import { Abi } from '../block-content';

export class BlockReaderMessage<MessageContentType> {
  public static readonly version = 'v0';

  public static create(dto: Uint8Array, abi: Abi) {
    const result = deserializeMessage('result', dto, abi.getTypesMap());
    let content: unknown;
    let type: string;

    if (result) {
      const [resultType, contentDto]: [string, unknown] = result;
      type = resultType;
      content = contentDto;

      if (resultType === `get_blocks_result_${this.version}`) {
        (<BlockJson>content).abi = abi.toHex();
        return new BlockReaderMessage<Block>(type, Block.fromJson(<BlockJson>content));
      }
    }

    return null;
  }

  private constructor(
    public readonly type: string,
    public readonly content: MessageContentType
  ) {}
}
