import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisionAnalysis } from './useVisionAnalysis';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { description: 'test' }, error: null }),
    },
  },
}));

describe('useVisionAnalysis optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reuse canvas elements across calls', async () => {
    const createElementSpy = vi.spyOn(document, 'createElement');

    const { result } = renderHook(() => useVisionAnalysis());

    const mockVideo = {
      videoWidth: 1000,
      videoHeight: 1000,
    } as unknown as HTMLVideoElement;

    // First call
    await act(async () => {
      await result.current.analyzeFrame(mockVideo);
    });

    // Should have created 2 canvases (one for capture, one for resize since width > 800)
    const canvasCallsAfterFirst = createElementSpy.mock.calls.filter(call => call[0] === 'canvas').length;
    expect(canvasCallsAfterFirst).toBe(2);

    // Second call
    await act(async () => {
      await result.current.analyzeFrame(mockVideo);
    });

    // Should still have created only 2 canvases TOTAL (reused)
    const canvasCallsAfterSecond = createElementSpy.mock.calls.filter(call => call[0] === 'canvas').length;
    expect(canvasCallsAfterSecond).toBe(2);
  });

  it('should update canvas dimensions if video dimensions change', async () => {
    const createElementSpy = vi.spyOn(document, 'createElement');

    const { result } = renderHook(() => useVisionAnalysis());

    const mockVideo1 = {
      videoWidth: 1000,
      videoHeight: 1000,
    } as unknown as HTMLVideoElement;

    const mockVideo2 = {
      videoWidth: 1200,
      videoHeight: 1200,
    } as unknown as HTMLVideoElement;

    // First call
    await act(async () => {
      await result.current.analyzeFrame(mockVideo1);
    });

    // Second call with different dimensions
    await act(async () => {
      await result.current.analyzeFrame(mockVideo2);
    });

    // Should still have created only 2 canvases TOTAL (reused and updated)
    const totalCanvasCalls = createElementSpy.mock.calls.filter(call => call[0] === 'canvas').length;
    expect(totalCanvasCalls).toBe(2);
  });
});
