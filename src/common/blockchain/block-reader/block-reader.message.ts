/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Abi } from '../abi';
import { deserializeMessage } from './block-reader.utils';
import { Block } from './block/block';
import { BlockJson } from './block/block.types';

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
        (<BlockJson>content).abi_version = abi.version;
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
