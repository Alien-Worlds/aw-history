import { BroadcastTcpMessageType } from '@alien-worlds/aw-broadcast';
import { InternalBroadcastMessage } from '../internal-broadcast.message';

describe('InternalBroadcastMessage', () => {
  describe('create', () => {
    it('should create an internal broadcast message', () => {
      const content = {
        sender: null,
        channel: null,
        name: null,
        data: null,
      } as any;
      const message = InternalBroadcastMessage.create(content);

      expect(message).toBeInstanceOf(InternalBroadcastMessage);
      expect(message.sender).toBeNull();
      expect(message.channel).toBeNull();
      expect(message.type).toBe(BroadcastTcpMessageType.Data);
      expect(message.name).toBeNull();
      expect(message.data).toBeNull();
    });
  });
});
