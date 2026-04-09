import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { OfflineQueue } from '@/utils/OfflineQueue';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

describe('OfflineQueue', () => {
  let queue: OfflineQueue;

  beforeEach(() => {
    localStorage.clear();
    queue = new OfflineQueue({ syncOnReconnect: false });
  });

  it('should generate secure UUIDs for request IDs', async () => {
    const result = await queue.enqueue('https://api.example.com/data');

    if (result.queued) {
      expect(result.id).toMatch(/^req_\d+_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    } else {
      throw new Error('Request was not queued');
    }
  });

  it('should queue multiple requests and maintain order', async () => {
    await queue.enqueue('https://api.example.com/1');
    await queue.enqueue('https://api.example.com/2');

    const storedQueue = queue.getQueue();
    expect(storedQueue.length).toBe(2);
    expect(storedQueue[0].url).toBe('https://api.example.com/1');
    expect(storedQueue[1].url).toBe('https://api.example.com/2');
  });

  it('should respect max queue size', async () => {
    const smallQueue = new OfflineQueue({ maxQueueSize: 1 });
    await smallQueue.enqueue('https://api.example.com/1');
    const result = await smallQueue.enqueue('https://api.example.com/2');

    expect(result.queued).toBe(false);
    expect(smallQueue.size()).toBe(1);
  });
});
