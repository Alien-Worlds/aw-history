import { FilterBroadcastMessage } from '../filter-broadcast.message';

describe('FilterBroadcastMessage', () => {
  describe('ready', () => {
    it('should create a ready broadcast message', () => {
      const message = FilterBroadcastMessage.ready();

      expect(message).toBeDefined();
    });
  });

  describe('refresh', () => {
    it('should create a refresh broadcast message', () => {
      const message = FilterBroadcastMessage.refresh();

      expect(message).toBeDefined();
    });
  });
});
