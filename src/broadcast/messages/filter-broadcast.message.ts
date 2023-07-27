import { BroadcastMessage } from '@alien-worlds/aw-broadcast';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../internal-broadcast.enums';

/**
 * Represents a class for filter broadcast messages.
 */
export class FilterBroadcastMessage {
  /**
   * Creates a ready broadcast message.
   *
   * @returns {BroadcastMessage} The ready broadcast message.
   */
  public static ready() {
    return BroadcastMessage.create(
      null,
      InternalBroadcastChannel.Bootstrap,
      null,
      InternalBroadcastMessageName.FilterReady
    );
  }

  /**
   * Creates a refresh broadcast message.
   *
   * @returns {BroadcastMessage} The refresh broadcast message.
   */
  public static refresh() {
    return BroadcastMessage.create(
      null,
      InternalBroadcastChannel.Filter,
      null,
      InternalBroadcastMessageName.FilterRefresh
    );
  }
}
