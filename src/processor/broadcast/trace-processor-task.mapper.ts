/* eslint-disable @typescript-eslint/require-await */
import { BroadcastMessageContentMapper } from '../../common/broadcast';
import { TraceProcessorTaskMessageContent } from './trace-processor-task.message-content';

export class TraceProcessorTaskBroadcastMapper
  implements BroadcastMessageContentMapper<TraceProcessorTaskMessageContent>
{
  public async toContent(buffer: Buffer): Promise<TraceProcessorTaskMessageContent> {
    return TraceProcessorTaskMessageContent.fromMessageBuffer(buffer);
  }

  public toBuffer(content: TraceProcessorTaskMessageContent): Buffer {
    return content.toBuffer();
  }
}
