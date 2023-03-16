import { BroadcastTcpMessageType } from '@alien-worlds/api-core';
import { BlockRangeTaskData } from '../../common/common.types';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../internal-broadcast.enums';

/**
 * Message content
 */
export class BlockRangeBroadcastMessages {
  public static createBlockRangeTaskMessage(data: BlockRangeTaskData) {
    return {
      channel: InternalBroadcastChannel.BlockRange,
      name: InternalBroadcastMessageName.BlockRangeTask,
      type: BroadcastTcpMessageType.Data,
      data,
    };
  }

  public static createBlockRangeReadyMessage() {
    return {
      channel: InternalBroadcastChannel.BlockRange,
      name: InternalBroadcastMessageName.BlockRangeReady,
      type: BroadcastTcpMessageType.Data,
    };
  }
}
