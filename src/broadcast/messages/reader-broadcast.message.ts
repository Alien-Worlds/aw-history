import { BroadcastTcpMessageType } from '@alien-worlds/api-core';
import { Mode } from '../../common/common.enums';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../internal-broadcast.enums';

export type ReaderBroadcastMessageData = {
  startBlock?: bigint;
  endBlock?: bigint;
  mode: string;
  scanKey?: string;
};

/**
 * Message content
 */
export class ReaderBroadcastMessage {
  public static newReplayModeTask(data: ReaderBroadcastMessageData) {
    data.mode = Mode.Replay;
    return {
      channel: InternalBroadcastChannel.ReplayModeReader,
      name: InternalBroadcastMessageName.ReaderTask,
      type: BroadcastTcpMessageType.Data,
      data,
    };
  }

  public static newDefaultModeTask(data: ReaderBroadcastMessageData) {
    data.mode = Mode.Default;
    return {
      channel: InternalBroadcastChannel.DefaultModeReader,
      name: InternalBroadcastMessageName.ReaderTask,
      type: BroadcastTcpMessageType.Data,
      data,
    };
  }

  public static defaultModeReady() {
    return {
      channel: InternalBroadcastChannel.Bootstrap,
      name: InternalBroadcastMessageName.DefaultModeReaderReady,
      type: BroadcastTcpMessageType.Data,
    };
  }

  public static replayModeReady() {
    return {
      channel: InternalBroadcastChannel.Bootstrap,
      name: InternalBroadcastMessageName.ReplayModeReaderReady,
      type: BroadcastTcpMessageType.Data,
    };
  }
}
