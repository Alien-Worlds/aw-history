import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../internal-broadcast.enums';
import { BroadcastMessage, Mode } from '@alien-worlds/history-tools-common';

/**
 * Data structure for the reader broadcast message.
 */
export type ReaderBroadcastMessageData = {
  startBlock?: bigint;
  endBlock?: bigint;
  mode: string;
  scanKey?: string;
};

/**
 * Represents a class for reader broadcast messages.
 */
export class ReaderBroadcastMessage {
  /**
   * Creates a new replay mode task broadcast message.
   *
   * @param {ReaderBroadcastMessageData} data - The data for the message.
   * @returns {BroadcastMessage} The new replay mode task broadcast message.
   */
  public static newReplayModeTask(data: ReaderBroadcastMessageData): BroadcastMessage {
    data.mode = Mode.Replay;
    return BroadcastMessage.create(
      null,
      InternalBroadcastChannel.ReplayModeReader,
      data,
      InternalBroadcastMessageName.ReaderTask
    );
  }
  /**
   * Creates a new default mode task broadcast message.
   *
   * @param {ReaderBroadcastMessageData} data - The data for the message.
   * @returns {BroadcastMessage} The new default mode task broadcast message.
   */
  public static newDefaultModeTask(data: ReaderBroadcastMessageData): BroadcastMessage {
    data.mode = Mode.Default;
    return BroadcastMessage.create(
      null,
      InternalBroadcastChannel.DefaultModeReader,
      data,
      InternalBroadcastMessageName.ReaderTask
    );
  }
  /**
   * Creates a default mode ready broadcast message.
   *
   * @returns {BroadcastMessage} The default mode ready broadcast message.
   */
  public static defaultModeReady(): BroadcastMessage {
    return BroadcastMessage.create(
      null,
      InternalBroadcastChannel.Bootstrap,
      null,
      InternalBroadcastMessageName.DefaultModeReaderReady
    );
  }
  /**
   * Creates a replay mode ready broadcast message.
   *
   * @returns {BroadcastMessage} The replay mode ready broadcast message.
   */
  public static replayModeReady(): BroadcastMessage {
    return BroadcastMessage.create(
      null,
      InternalBroadcastChannel.Bootstrap,
      null,
      InternalBroadcastMessageName.ReplayModeReaderReady
    );
  }
}
