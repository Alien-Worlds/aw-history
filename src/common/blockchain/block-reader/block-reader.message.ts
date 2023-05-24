/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Abi } from '../abi';
import { GetBlocksResultMessageContent } from './block-reader.types';
import { deserializeMessage } from './block-reader.utils';
import { Block } from './block/block';
import { BlockJson } from './block/block.types';

export class BlockReaderMessage<MessageContentType = GetBlocksResultMessageContent> {
  public static readonly version = 'v0';

  private static isGetBlocksResultPongMessage(data: GetBlocksResultMessageContent): boolean {
    return (
      typeof data.head === 'object' &&
      typeof data.last_irreversible === 'object' &&
      !data.prev_block &&
      !data.this_block &&
      !data.block &&
      !data.traces &&
      !data.deltas
    );
  }

  public static create<MessageContentType = GetBlocksResultMessageContent>(
    dto: Uint8Array,
    abi: Abi
  ) {
    const result = deserializeMessage('result', dto, abi.getTypesMap());
    const [resultType, resultJson]: [string, MessageContentType] = result || [];

    if (resultType) {
      if (resultType === `get_blocks_result_${this.version}`) {
        if (
          BlockReaderMessage.isGetBlocksResultPongMessage(
            <GetBlocksResultMessageContent>resultJson
          )
        ) {
          return new BlockReaderMessage<Block>(resultType, null, true);
        }

        (<BlockJson>resultJson).abi_version = abi.version;
        return new BlockReaderMessage<Block>(
          resultType,
          Block.fromJson(<BlockJson>resultJson)
        );
      }
    }

    return null;
  }

  private constructor(
    public readonly type: string,
    public readonly content: MessageContentType,
    public readonly isPongMessage = false
  ) {}
}
