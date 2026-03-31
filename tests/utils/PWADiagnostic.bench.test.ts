import { describe, it, expect, mock } from 'bun:test';
import { PWADiagnostic, WebManifest } from '@/utils/PWADiagnostic';

describe('PWADiagnostic.checkIcons Performance', () => {
  it('measures checkIcons performance and verifies functionality', async () => {
    const DELAY_MS = 50;
    const iconCount = 5;

    const manifest: WebManifest = {
      icons: Array.from({ length: iconCount }, (_, i) => ({
        src: `/icon-${i}.png`,
        sizes: '192x192',
        type: 'image/png'
      }))
    };

    // Mock global fetch to succeed for even indices and fail for odd indices
    (globalThis as any).fetch = mock(async (url: string) => {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      const index = parseInt(url.split('-')[1].split('.')[0], 10);
      return { ok: index % 2 === 0 };
    });

    const start = performance.now();
    const result = await PWADiagnostic.checkIcons(manifest);
    const end = performance.now();

    const duration = end - start;
    console.log(`Execution duration with ${iconCount} icons and ${DELAY_MS}ms delay: ${duration.toFixed(2)}ms`);

    // Performance assertion: should be parallelized (close to DELAY_MS, not iconCount * DELAY_MS)
    expect(duration).toBeLessThan(150);

    // Functional assertions
    expect(result.details).toBeDefined();
    if (result.details) {
      expect(result.details.found).toEqual(['/icon-0.png', '/icon-2.png', '/icon-4.png']);
      expect(result.details.missing).toEqual(['/icon-1.png', '/icon-3.png']);
    }

    // At least 2 found icons = passed
    expect(result.passed).toBe(true);
    expect(result.message).toBe('Icons found: 3/5');
  });

  it('handles fetch exceptions correctly', async () => {
    const manifest: WebManifest = {
      icons: [{ src: '/error-icon.png' }]
    };

    (globalThis as any).fetch = mock(async () => {
      throw new Error('Network failure');
    });

    const result = await PWADiagnostic.checkIcons(manifest);

    expect(result.passed).toBe(false);
    expect(result.details?.missing).toContain('/error-icon.png');
    expect(result.details?.found).toHaveLength(0);
  });
});
