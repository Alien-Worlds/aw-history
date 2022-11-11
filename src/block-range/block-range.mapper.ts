/* eslint-disable @typescript-eslint/require-await */
import { BroadcastMessageContentMapper } from '../common/broadcast';
import { BlockRangeMessageContent } from './block-range.message-content';

export class BlockRangeBroadcastMapper
  implements BroadcastMessageContentMapper<BlockRangeMessageContent>
{
  public async toContent(buffer: Buffer): Promise<BlockRangeMessageContent> {
    return BlockRangeMessageContent.fromBuffer(buffer);
  }

  public toBuffer(content: BlockRangeMessageContent): Buffer {
    return content.toBuffer();
  }
}
