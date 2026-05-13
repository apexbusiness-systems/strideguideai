import { expect, test, describe, mock, beforeAll, afterAll } from "bun:test";
import { PWADiagnostic, WebManifest } from "../../src/utils/PWADiagnostic";

// Mock global fetch
const originalFetch = global.fetch;

describe("PWADiagnostic.checkIcons Benchmark", () => {
  const mockManifest: WebManifest = {
    icons: [
      { src: "icon1.png", sizes: "192x192" },
      { src: "icon2.png", sizes: "512x512" },
      { src: "icon3.png", sizes: "144x144" },
      { src: "icon4.png", sizes: "96x96" },
      { src: "icon5.png", sizes: "48x48" },
    ],
  };

  test("Measures performance of checkIcons", async () => {
    // Mock fetch with a 100ms delay to simulate network latency
    global.fetch = mock(async (url: string) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { ok: true } as Response;
    }) as any;

    const start = performance.now();
    await PWADiagnostic.checkIcons(mockManifest);
    const end = performance.now();
    const duration = end - start;

    console.log(`Duration with 5 icons: ${duration.toFixed(2)}ms`);

    // With 5 icons and 100ms delay each, sequential should take ~500ms
    // Parallel should take ~100ms
    expect(duration).toBeGreaterThan(0);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });
});
