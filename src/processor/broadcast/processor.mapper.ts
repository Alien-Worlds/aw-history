/* eslint-disable @typescript-eslint/require-await */
import { BroadcastMessageContentMapper } from '../../common/broadcast';
import { ProcessorMessageContent } from './processor.message-content';

export class ProcessorBroadcastMapper
  implements BroadcastMessageContentMapper<ProcessorMessageContent>
{
  public async toContent(buffer: Buffer): Promise<ProcessorMessageContent> {
    return ProcessorMessageContent.fromMessageBuffer(buffer);
  }

  public toBuffer(content: ProcessorMessageContent): Buffer {
    return content.toBuffer();
  }
}
