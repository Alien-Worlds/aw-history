/* eslint-disable @typescript-eslint/require-await */
import { BroadcastMessageContentMapper } from '../../common/broadcast';
import { TraceProcessorMessageContent } from './trace-processor.message-content';

export class TraceProcessorBroadcastMapper
  implements BroadcastMessageContentMapper<TraceProcessorMessageContent>
{
  public async toContent(buffer: Buffer): Promise<TraceProcessorMessageContent> {
    return TraceProcessorMessageContent.fromMessageBuffer(buffer);
  }

  public toBuffer(content: TraceProcessorMessageContent): Buffer {
    return content.toBuffer();
  }
}
