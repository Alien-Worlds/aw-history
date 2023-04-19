import { BroadcastTcpMessageType } from '@alien-worlds/api-core';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../internal-broadcast.enums';

/**
 * Message content
 */
export class FilterBroadcastMessage {
  public static ready() {
    return {
      channel: InternalBroadcastChannel.Bootstrap,
      name: InternalBroadcastMessageName.FilterReady,
      type: BroadcastTcpMessageType.Data,
    };
  }

  public static refresh() {
    return {
      channel: InternalBroadcastChannel.Filter,
      name: InternalBroadcastMessageName.FilterRefresh,
      type: BroadcastTcpMessageType.Data,
    };
  }
}
