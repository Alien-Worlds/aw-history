import { BroadcastTcpMessageType } from '@alien-worlds/api-core';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../internal-broadcast.enums';

/**
 * Message content
 */
export class ProcessorBroadcastMessage {
  public static ready() {
    return {
      channel: InternalBroadcastChannel.Processor,
      name: InternalBroadcastMessageName.ProcessorReady,
      type: BroadcastTcpMessageType.Data,
    };
  }
}
