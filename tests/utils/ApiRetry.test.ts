import { describe, it, expect, mock, spyOn, beforeEach, afterEach } from 'bun:test';
import { retryWithBackoff, fetchWithRetry, invokeWithRetry } from '../../src/utils/ApiRetry';

describe('ApiRetry', () => {
  let warnSpy: any;
  let errorSpy: any;

  beforeEach(() => {
    warnSpy = spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = spyOn(console, 'error').mockImplementation(() => {});
    spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    mock.restore();
  });

  describe('retryWithBackoff', () => {
    it('should return result on first attempt if successful', async () => {
      const fn = mock(() => Promise.resolve('success'));
      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry and eventually succeed', async () => {
      let count = 0;
      const fn = mock(() => {
        count++;
        if (count < 3) return Promise.reject(new TypeError('fetch failed'));
        return Promise.resolve('success');
      });

      const result = await retryWithBackoff(fn, { initialDelay: 1 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw last error when max retries reached', async () => {
      const error = new TypeError('fetch failed');
      const fn = mock().mockRejectedValue(error);

      try {
        await retryWithBackoff(fn, { maxRetries: 2, initialDelay: 1 });
        expect(true).toBe(false); // Should not reach here
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should throw immediately on non-retryable error', async () => {
      const error = new Error('Non-retryable');
      const fn = mock().mockRejectedValue(error);

      try {
        await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 1 });
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect retryableStatuses', async () => {
      const fn = mock().mockRejectedValue({ status: 400 });

      // 400 is not retryable by default
      try {
        await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 1 });
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toEqual({ status: 400 });
      }
      expect(fn).toHaveBeenCalledTimes(1);

      fn.mockClear();

      // Now make 400 retryable
      let count = 0;
      fn.mockImplementation(() => {
        count++;
        if (count === 1) return Promise.reject({ status: 400 });
        return Promise.resolve('success');
      });

      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 1,
        retryableStatuses: [400]
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff with jitter', async () => {
      // Mock setTimeout to capture delay and resolve immediately
      const setTimeoutSpy = spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        cb();
        return 1 as any;
      });

      const fn = mock()
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce('success');

      await retryWithBackoff(fn, {
        initialDelay: 100,
        backoffMultiplier: 2
      });

      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
      // Math.random = 0.5, initialDelay = 100
      // attempt 0: 100 * 2^0 + 0.5 * 0.1 * 100 = 100 + 5 = 105
      expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 105);
      // attempt 1: 100 * 2^1 + 0.5 * 0.1 * 200 = 200 + 10 = 210
      expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 210);

      setTimeoutSpy.mockRestore();
    });
  });

  describe('fetchWithRetry', () => {
    it('should return response on success', async () => {
      const mockResponse = { ok: true, status: 200 } as Response;
      const fetchSpy = spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await fetchWithRetry('https://api.example.com');

      expect(result).toBe(mockResponse);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      fetchSpy.mockRestore();
    });

    it('should retry on retryable status codes', async () => {
      const errorResponse = { ok: false, status: 500, statusText: 'Internal Server Error' } as Response;
      const successResponse = { ok: true, status: 200 } as Response;

      const fetchSpy = spyOn(global, 'fetch')
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const result = await fetchWithRetry('https://api.example.com', {}, { initialDelay: 1 });

      expect(result).toBe(successResponse);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      fetchSpy.mockRestore();
    });

    it('should not retry on non-retryable status codes', async () => {
      const errorResponse = { ok: false, status: 400, statusText: 'Bad Request' } as Response;

      const fetchSpy = spyOn(global, 'fetch').mockResolvedValue(errorResponse);

      const result = await fetchWithRetry('https://api.example.com', {}, { initialDelay: 1 });

      expect(result).toBe(errorResponse);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      fetchSpy.mockRestore();
    });
  });

  describe('invokeWithRetry', () => {
    it('should return data on success', async () => {
      const mockSupabase = {
        functions: {
          invoke: mock(() => Promise.resolve({ data: { result: 'ok' }, error: null }))
        }
      } as any;

      const { data, error } = await invokeWithRetry(mockSupabase, 'test-func');

      expect(data).toEqual({ result: 'ok' });
      expect(error).toBeNull();
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(1);
    });

    it('should retry on network error', async () => {
      const mockSupabase = {
        functions: {
          invoke: mock()
            .mockResolvedValueOnce({ data: null, error: { message: 'fetch failed', status: 500 } })
            .mockResolvedValueOnce({ data: { result: 'ok' }, error: null })
        }
      } as any;

      const { data, error } = await invokeWithRetry(mockSupabase, 'test-func', {}, { initialDelay: 1 });

      expect(data).toEqual({ result: 'ok' });
      expect(error).toBeNull();
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(2);
    });

    it('should return error if all retries fail', async () => {
      const mockSupabase = {
        functions: {
          invoke: mock(() => Promise.resolve({ data: null, error: { message: 'persistent failure', status: 500 } }))
        }
      } as any;

      const { data, error } = await invokeWithRetry(mockSupabase, 'test-func', {}, { maxRetries: 1, initialDelay: 1 });

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(2);
    });
  });
});
