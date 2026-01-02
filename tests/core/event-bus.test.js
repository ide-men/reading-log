import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus, Events } from '../../js/shared/event-bus.js';

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  describe('on / emit', () => {
    it('イベントを購読して受信できる', () => {
      const callback = vi.fn();
      eventBus.on('test:event', callback);
      eventBus.emit('test:event', { data: 'hello' });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ data: 'hello' });
    });

    it('複数のリスナーが受信できる', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      eventBus.on('test:event', callback1);
      eventBus.on('test:event', callback2);
      eventBus.emit('test:event', 'data');

      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
    });

    it('異なるイベントは干渉しない', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      eventBus.on('event:a', callback1);
      eventBus.on('event:b', callback2);
      eventBus.emit('event:a', 'data-a');

      expect(callback1).toHaveBeenCalledWith('data-a');
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('購読を解除できる', () => {
      const callback = vi.fn();
      eventBus.on('test:event', callback);
      eventBus.off('test:event', callback);
      eventBus.emit('test:event', 'data');

      expect(callback).not.toHaveBeenCalled();
    });

    it('on()の戻り値で購読解除できる', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.on('test:event', callback);
      unsubscribe();
      eventBus.emit('test:event', 'data');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('一度だけ受信する', () => {
      const callback = vi.fn();
      eventBus.once('test:event', callback);
      eventBus.emit('test:event', 'first');
      eventBus.emit('test:event', 'second');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');
    });
  });

  describe('listenerCount', () => {
    it('リスナー数を取得できる', () => {
      expect(eventBus.listenerCount('test:event')).toBe(0);

      const cb1 = vi.fn();
      const cb2 = vi.fn();
      eventBus.on('test:event', cb1);
      expect(eventBus.listenerCount('test:event')).toBe(1);

      eventBus.on('test:event', cb2);
      expect(eventBus.listenerCount('test:event')).toBe(2);

      eventBus.off('test:event', cb1);
      expect(eventBus.listenerCount('test:event')).toBe(1);
    });
  });

  describe('clear', () => {
    it('全リスナーをクリアできる', () => {
      const callback = vi.fn();
      eventBus.on('event:a', callback);
      eventBus.on('event:b', callback);
      eventBus.clear();
      eventBus.emit('event:a', 'data');
      eventBus.emit('event:b', 'data');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('リスナーでエラーが発生しても他のリスナーは実行される', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('test error');
      });
      const normalCallback = vi.fn();

      // コンソールエラーを抑制
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      eventBus.on('test:event', errorCallback);
      eventBus.on('test:event', normalCallback);
      eventBus.emit('test:event', 'data');

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Events定数', () => {
    it('イベント名が定義されている', () => {
      expect(Events.BOOK_ADDED).toBe('book:added');
      expect(Events.TIMER_STARTED).toBe('timer:started');
      expect(Events.STATE_CHANGED).toBe('state:changed');
    });
  });
});
