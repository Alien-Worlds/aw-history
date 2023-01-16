import { BroadcastTcpMessageType } from '../../common/broadcast';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../internal-broadcast.enums';

/**
 * Message content
 */
export class ProcessorBroadcastMessages {
  public static createProcessorReadyMessage() {
    return {
      channel: InternalBroadcastChannel.Processor,
      name: InternalBroadcastMessageName.ProcessorReady,
      type: BroadcastTcpMessageType.Data,
    };
  }
}
