import { describe, it, expect } from 'vitest';
import { formatFileSize, needsOptimization } from '@/utils/ImageOptimizer';

describe('formatFileSize', () => {
  it('should format 0 bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('should format bytes correctly', () => {
    expect(formatFileSize(512)).toBe('512 Bytes');
    expect(formatFileSize(1023)).toBe('1023 Bytes');
  });

  it('should format KB correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 1024 - 1)).toBe('1024 KB');
  });

  it('should format MB correctly', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
  });

  it('should format GB correctly', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
  });

  it('should handle decimal places correctly', () => {
    expect(formatFileSize(1234)).toBe('1.21 KB');
    expect(formatFileSize(1234567)).toBe('1.18 MB');
  });
});

describe('needsOptimization', () => {
  const createMockFile = (size: number) => ({ size } as File);

  it('should return true if file size is above default threshold', () => {
    const file = createMockFile(3 * 1024 * 1024); // 3MB
    expect(needsOptimization(file)).toBe(true);
  });

  it('should return false if file size is below default threshold', () => {
    const file = createMockFile(1 * 1024 * 1024); // 1MB
    expect(needsOptimization(file)).toBe(false);
  });

  it('should return false if file size is exactly at default threshold', () => {
    const file = createMockFile(2 * 1024 * 1024); // 2MB
    expect(needsOptimization(file)).toBe(false);
  });

  it('should use custom threshold when provided', () => {
    const file = createMockFile(500 * 1024); // 500KB
    expect(needsOptimization(file, 400 * 1024)).toBe(true);
    expect(needsOptimization(file, 600 * 1024)).toBe(false);
  });
});
