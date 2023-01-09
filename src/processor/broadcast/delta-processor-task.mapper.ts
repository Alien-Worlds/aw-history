/* eslint-disable @typescript-eslint/require-await */
import { BroadcastMessageContentMapper } from '../../common/broadcast';
import { DeltaProcessorTaskMessageContent } from './delta-processor-task.message-content';

export class DeltaProcessorTaskBroadcastMapper
  implements BroadcastMessageContentMapper<DeltaProcessorTaskMessageContent>
{
  public async toContent(buffer: Buffer): Promise<DeltaProcessorTaskMessageContent> {
    return DeltaProcessorTaskMessageContent.fromMessageBuffer(buffer);
  }

  public toBuffer(content: DeltaProcessorTaskMessageContent): Buffer {
    return content.toBuffer();
  }
}
