import {
  BroadcastTcpMessage,
  BroadcastTcpMessageContent,
  BroadcastTcpMessageType,
} from '@alien-worlds/history-tools-common';

/**
 * Represents an internal broadcast message.
 *
 * @template DataType - The type of data for the message.
 */
export class InternalBroadcastMessage<
  DataType = unknown
> extends BroadcastTcpMessage<DataType> {
  /**
   * Creates an internal broadcast message.
   *
   * @param {BroadcastTcpMessageContent<DataType>} content - The content for the message.
   * @returns {InternalBroadcastMessage<DataType>} The created internal broadcast message.
   */
  public static create<DataType = unknown>(
    content: BroadcastTcpMessageContent<DataType>
  ) {
    const { sender, channel, name, data } = content;
    return new InternalBroadcastMessage(
      null,
      sender,
      channel,
      BroadcastTcpMessageType.Data,
      name,
      null,
      data
    );
  }
}
