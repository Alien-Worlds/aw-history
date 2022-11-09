/* eslint-disable @typescript-eslint/require-await */
import { BroadcastMessageContentMapper } from '../../common/broadcast';
import { DeltaProcessorMessageContent } from './delta-processor.message-content';

export class DeltaProcessorBroadcastMapper
  implements BroadcastMessageContentMapper<DeltaProcessorMessageContent>
{
  public async toContent(buffer: Buffer): Promise<DeltaProcessorMessageContent> {
    return DeltaProcessorMessageContent.fromMessageBuffer(buffer);
  }

  public toBuffer(content: DeltaProcessorMessageContent): Buffer {
    return content.toBuffer();
  }
}
