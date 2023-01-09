/* eslint-disable @typescript-eslint/require-await */
import { BroadcastMessageContentMapper } from '../../common/broadcast';
import { BlockRangeTaskMessageContent } from './block-range-task.message-content';

export class BlockRangeTaskBroadcastMapper
  implements BroadcastMessageContentMapper<BlockRangeTaskMessageContent>
{
  public async toContent(buffer: Buffer): Promise<BlockRangeTaskMessageContent> {
    return BlockRangeTaskMessageContent.fromBuffer(buffer);
  }

  public toBuffer(content: BlockRangeTaskMessageContent): Buffer {
    return content.toBuffer();
  }
}
