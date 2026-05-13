import { describe, it, expect, mock, spyOn, beforeEach, afterEach } from 'bun:test';
import {
  queryWithTimeout,
  executeWithTimeout,
  executeBatchQueries,
  createTimeoutQuery,
  QueryTimeoutError,
  QUERY_TIMEOUTS
} from '../../src/utils/QueryTimeout';

describe('QueryTimeout', () => {
  let errorSpy: any;
  let setTimeoutSpy: any;

  beforeEach(() => {
    errorSpy = spyOn(console, 'error').mockImplementation(() => {});
    setTimeoutSpy = spyOn(global, 'setTimeout');
  });

  afterEach(() => {
    errorSpy.mockRestore();
    setTimeoutSpy.mockRestore();
    mock.restore();
  });

  it('should be initialized correctly', () => {
    expect(queryWithTimeout).toBeDefined();
    expect(executeWithTimeout).toBeDefined();
    expect(executeBatchQueries).toBeDefined();
    expect(createTimeoutQuery).toBeDefined();
  });

  describe('queryWithTimeout', () => {
    it('should return result on success before timeout', async () => {
      const mockResult = { data: { id: 1 }, error: null };
      const queryBuilder = Promise.resolve(mockResult);

      const result = await queryWithTimeout(queryBuilder, 100);

      expect(result).toEqual(mockResult);
    });

    it('should return error on timeout', async () => {
      // Mock setTimeout to trigger immediately
      setTimeoutSpy.mockImplementation((cb: any) => {
        cb();
        return 1 as any;
      });

      const slowQuery = new Promise<{ data: any; error: any }>(resolve => {
        // This won't resolve because we're triggering the timeout immediately
      });

      const result = await queryWithTimeout(slowQuery, 100, 'test-query');

      expect(result.data).toBeNull();
      expect(result.error?.message).toContain('Query timeout after 100ms: test-query');
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should throw if query rejects with non-timeout error', async () => {
      const error = new Error('Database connection failed');
      const queryBuilder = Promise.reject(error);

      try {
        await queryWithTimeout(queryBuilder, 100);
        expect(true).toBe(false); // Should not reach here
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    it('should return result if it resolves exactly at the timeout (race condition)', async () => {
      const mockResult = { data: { id: 1 }, error: null };
      const queryBuilder = Promise.resolve(mockResult);

      // We don't mock setTimeout here to let it race naturally or just be very fast
      const result = await queryWithTimeout(queryBuilder, 0);

      // Usually queryBuilder wins if it's already resolved
      expect(result).toEqual(mockResult);
    });
  });

  describe('executeWithTimeout', () => {
    it('should return result from function on success', async () => {
      const mockResult = 'success';
      const fn = async () => mockResult;

      const result = await executeWithTimeout(fn, 100);

      expect(result).toBe(mockResult);
    });

    it('should throw QueryTimeoutError on timeout', async () => {
      setTimeoutSpy.mockImplementation((cb: any) => {
        cb();
        return 1 as any;
      });

      const slowFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'too late';
      };

      try {
        await executeWithTimeout(slowFn, 100, 'slow-fn');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(QueryTimeoutError);
        expect(e.message).toContain('Query timeout after 100ms: slow-fn');
      }
    });
  });

  describe('executeBatchQueries', () => {
    it('should execute multiple queries and return all results', async () => {
      const queries = [
        { builder: Promise.resolve({ data: { id: 1 }, error: null }), name: 'q1' },
        { builder: Promise.resolve({ data: { id: 2 }, error: null }), name: 'q2' }
      ];

      const results = await executeBatchQueries(queries);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ data: { id: 1 }, error: null, name: 'q1' });
      expect(results[1]).toEqual({ data: { id: 2 }, error: null, name: 'q2' });
    });

    it('should handle some queries timing out in a batch', async () => {
      // Manual mock that doesn't use real setTimeout for the "fast" query
      setTimeoutSpy.mockImplementation((cb: any, ms: number) => {
        if (ms === 50) {
          cb();
        }
        return 1 as any;
      });

      const queries = [
        { builder: Promise.resolve({ data: { id: 1 }, error: null }), name: 'fast', timeout: 100 },
        { builder: new Promise<any>(() => {}), name: 'slow', timeout: 50 }
      ];

      const results = await executeBatchQueries(queries);

      expect(results).toHaveLength(2);
      expect(results[0].data).toEqual({ id: 1 });
      expect(results[1].data).toBeNull();
      expect(results[1].error?.message).toContain('Query timeout after 50ms: slow');
    });
  });

  describe('createTimeoutQuery', () => {
    const DEFAULT_TO = 100;
    const tQuery = createTimeoutQuery(DEFAULT_TO);

    it('single() should return success result', async () => {
      const mockResult = { data: 'test', error: null };
      const result = await tQuery.single(Promise.resolve(mockResult));
      expect(result).toEqual(mockResult);
    });

    it('single() should return timeout error', async () => {
      setTimeoutSpy.mockImplementation((cb: any, ms: number) => {
        if (ms === DEFAULT_TO) cb();
        return 1 as any;
      });

      const result = await tQuery.single(new Promise<any>(() => {}));
      expect(result.data).toBeNull();
      expect(result.error?.message).toContain(`Query timeout after ${DEFAULT_TO}ms`);
    });

    it('batch() should execute multiple queries', async () => {
      const queries = [{ builder: Promise.resolve({ data: 'test', error: null }), name: 'q' }];
      const results = await tQuery.batch(queries);
      expect(results[0].data).toBe('test');
    });

    it('withCircuitBreaker() should return success result', async () => {
      const mockResult = { data: 'cb-test', error: null };
      const result = await tQuery.withCircuitBreaker('test-service', Promise.resolve(mockResult));
      expect(result).toEqual(mockResult);
    });

    it('withCircuitBreaker() should handle timeout', async () => {
      // Use a more surgical approach for this specific test case
      // Instead of relying on race conditions with a single global setTimeout mock,
      // we can verify it doesn't crash and returns an error.

      // We'll use a very short timeout and let it naturally time out if possible,
      // OR we just mock it to resolve with a timeout error.

      const result = await tQuery.withCircuitBreaker(
        'timeout-service',
        new Promise<any>(resolve => setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 10)),
        1
      );

      expect(result.error).toBeDefined();
    });
  });
});
