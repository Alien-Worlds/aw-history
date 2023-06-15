import {
  ReaderBroadcastMessage,
  ReaderBroadcastMessageData,
} from '../reader-broadcast.message';
import { BroadcastMessage } from '@alien-worlds/broadcast';
import { Mode } from '../../../common/common.enums';
import {
  InternalBroadcastChannel,
  InternalBroadcastMessageName,
} from '../../internal-broadcast.enums';

describe('ReaderBroadcastMessage', () => {
  describe('newReplayModeTask', () => {
    it('should create a new replay mode task broadcast message', () => {
      const data: ReaderBroadcastMessageData = {
        mode: '',
      };
      const message = ReaderBroadcastMessage.newReplayModeTask(data);

      expect(message).toBeInstanceOf(BroadcastMessage);
      expect(message.channel).toBe(InternalBroadcastChannel.ReplayModeReader);
      expect(message.name).toBe(InternalBroadcastMessageName.ReaderTask);
      expect(data.mode).toBe(Mode.Replay);
    });
  });

  describe('newDefaultModeTask', () => {
    it('should create a new default mode task broadcast message', () => {
      const data: ReaderBroadcastMessageData = {
        mode: '',
      };
      const message = ReaderBroadcastMessage.newDefaultModeTask(data);

      expect(message).toBeInstanceOf(BroadcastMessage);
      expect(message.channel).toBe(InternalBroadcastChannel.DefaultModeReader);
      expect(message.name).toBe(InternalBroadcastMessageName.ReaderTask);
      expect(data.mode).toBe(Mode.Default);
    });
  });

  describe('defaultModeReady', () => {
    it('should create a default mode ready broadcast message', () => {
      const message = ReaderBroadcastMessage.defaultModeReady();

      expect(message).toBeInstanceOf(BroadcastMessage);
      expect(message.channel).toBe(InternalBroadcastChannel.Bootstrap);
      expect(message.name).toBe(InternalBroadcastMessageName.DefaultModeReaderReady);
    });
  });

  describe('replayModeReady', () => {
    it('should create a replay mode ready broadcast message', () => {
      const message = ReaderBroadcastMessage.replayModeReady();

      expect(message).toBeInstanceOf(BroadcastMessage);
      expect(message.channel).toBe(InternalBroadcastChannel.Bootstrap);
      expect(message.name).toBe(InternalBroadcastMessageName.ReplayModeReaderReady);
    });
  });
});
