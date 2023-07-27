import { ProcessorBroadcastMessage } from '../processor-broadcast.message';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../../internal-broadcast.enums';
import { BroadcastMessage } from '@alien-worlds/aw-broadcast';

describe('ProcessorBroadcastMessage', () => {
  describe('ready', () => {
    it('should create a ready broadcast message', () => {
      const message = ProcessorBroadcastMessage.ready();

      expect(message).toBeInstanceOf(BroadcastMessage);
      expect(message.channel).toBe(InternalBroadcastChannel.Processor);
      expect(message.name).toBe(InternalBroadcastMessageName.ProcessorReady);
    });
  });

  describe('refresh', () => {
    it('should create a refresh broadcast message', () => {
      const message = ProcessorBroadcastMessage.refresh();

      expect(message).toBeInstanceOf(BroadcastMessage);
      expect(message.channel).toBe(InternalBroadcastChannel.Processor);
      expect(message.name).toBe(InternalBroadcastMessageName.ProcessorRefresh);
    });
  });
});
