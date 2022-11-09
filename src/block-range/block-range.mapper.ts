/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Serialize } from 'eosjs';
import { BroadcastMessageContentMapper } from '../common/broadcast';
import { BlockRangeMessageContent } from './block-range.message-content';

type BlockRangeMessageData = {
  scanKey: string;
  featuredTraces: string;
  featuredDeltas: string;
};

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
