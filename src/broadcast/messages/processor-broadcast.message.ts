import { BroadcastMessage } from '@alien-worlds/aw-broadcast';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../internal-broadcast.enums';

/**
 * Represents a class for processor broadcast messages.
 */
export class ProcessorBroadcastMessage {
  /**
   * Creates a ready broadcast message.
   *
   * @returns {BroadcastMessage} The ready broadcast message.
   */
  public static ready(): BroadcastMessage {
    return BroadcastMessage.create(
      null,
      InternalBroadcastChannel.Processor,
      null,
      InternalBroadcastMessageName.ProcessorReady
    );
  }
  /**
   * Creates a refresh broadcast message.
   *
   * @returns {BroadcastMessage} The refresh broadcast message.
   */
  public static refresh(): BroadcastMessage {
    return BroadcastMessage.create(
      null,
      InternalBroadcastChannel.Processor,
      null,
      InternalBroadcastMessageName.ProcessorRefresh
    );
  }
}
