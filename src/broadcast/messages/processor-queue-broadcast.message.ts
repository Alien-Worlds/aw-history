import { BroadcastTcpMessageType } from '@alien-worlds/api-core';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../internal-broadcast.enums';

/**
 * Message content
 */
export class ProcessorQueueBroadcastMessage {
  public static update() {
    return {
      channel: InternalBroadcastChannel.Processor,
      name: InternalBroadcastMessageName.ProcessorTasksQueueUpdate,
      type: BroadcastTcpMessageType.Data,
    };
  }
}
