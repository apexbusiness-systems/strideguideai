import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCamera, type CameraConfig } from '@/hooks/useCamera';

// Mock MediaStream
const mockStream = {
  getTracks: () => [
    {
      stop: vi.fn(),
      kind: 'video',
    },
  ],
} as unknown as MediaStream;

describe('useCamera', () => {
  const defaultConfig: CameraConfig = {
    width: 1280,
    height: 720,
    facingMode: 'environment',
    frameRate: 30,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getUserMedia
    global.navigator.mediaDevices = {
      getUserMedia: vi.fn(() => Promise.resolve(mockStream)),
      enumerateDevices: vi.fn(() => Promise.resolve([])),
    } as MediaDevices;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with camera inactive', () => {
    const { result } = renderHook(() => useCamera(defaultConfig));

    expect(result.current.isActive).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should detect camera support', async () => {
    const { result } = renderHook(() => useCamera(defaultConfig));

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
    });
  });

  it('should start camera successfully', async () => {
    const { result } = renderHook(() => useCamera(defaultConfig));

    await waitFor(async () => {
      const success = await result.current.startCamera();
      expect(success).toBe(true);
      expect(result.current.isActive).toBe(true);
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle camera permission denial', async () => {
    const error = new Error('Permission denied');
    global.navigator.mediaDevices.getUserMedia = vi.fn(() =>
      Promise.reject(error)
    );

    const { result } = renderHook(() => useCamera(defaultConfig));

    await waitFor(async () => {
      const success = await result.current.startCamera();
      expect(success).toBe(false);
      expect(result.current.isActive).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should stop camera and cleanup', async () => {
    const { result } = renderHook(() => useCamera(defaultConfig));

    await waitFor(async () => {
      await result.current.startCamera();
    });

    await waitFor(() => {
      result.current.stopCamera();
      expect(result.current.isActive).toBe(false);
    });
  });

  it('should handle unsupported camera', async () => {
    // Mock no camera support
    global.navigator.mediaDevices = undefined as unknown as MediaDevices;

    const { result } = renderHook(() => useCamera(defaultConfig));

    await waitFor(async () => {
      const success = await result.current.startCamera();
      expect(success).toBe(false);
      expect(result.current.error).toContain('not supported');
    });
  });
});

