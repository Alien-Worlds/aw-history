import { BroadcastTcpMessageType } from '@alien-worlds/api-core';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../internal-broadcast.enums';

/**
 * Message content
 */
export class ProcessorQueueBroadcastMessages {
  public static createUpdateMessage() {
    return {
      channel: InternalBroadcastChannel.Processor,
      name: InternalBroadcastMessageName.ProcessorTasksQueueUpdate,
      type: BroadcastTcpMessageType.Data,
    };
  }
}
