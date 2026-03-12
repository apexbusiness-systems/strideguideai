import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { AudioArmer } from '@/utils/AudioArmer';

describe('AudioArmer Performance', () => {
  let originalAudioContext: any;
  let originalWebkitAudioContext: any;
  let originalWindow: any;

  beforeEach(() => {
    // Mock global window if it doesn't exist
    if (typeof (globalThis as any).window === 'undefined') {
      (globalThis as any).window = globalThis;
    }

    originalAudioContext = (globalThis as any).AudioContext;
    originalWebkitAudioContext = (globalThis as any).webkitAudioContext;

    const MockAudioContext = class {
      state = 'running';
      resume() { return Promise.resolve(); }
      createBuffer() {
        return {
          getChannelData: () => new Float32Array(100)
        };
      }
      sampleRate = 44100;
      close() {}
    };

    (globalThis as any).AudioContext = MockAudioContext;
    (globalThis as any).webkitAudioContext = MockAudioContext;
    (globalThis as any).window.AudioContext = MockAudioContext;
  });

  afterEach(() => {
    AudioArmer.cleanup();
  });

  it('measures loadEarcons performance', async () => {
    // Inject artificial delay into createEarcon to make the difference measurable
    const DELAY_MS = 50;

    const createEarconSpy = spyOn(AudioArmer as any, 'createEarcon').mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      return { duration: 0.1 } as AudioBuffer;
    });

    const start = performance.now();
    await AudioArmer.initialize();
    const end = performance.now();

    const duration = end - start;
    console.log(`Optimized Initialization duration (with ${DELAY_MS}ms per earcon): ${duration.toFixed(2)}ms`);

    const earconCount = 7; // start, stop, success, found, warning, hot, cold

    // In parallel, it should take roughly DELAY_MS (plus overhead)
    // We expect it to be significantly less than sequential (350ms)
    expect(duration).toBeLessThan(150); // Generous buffer for overhead
    expect(AudioArmer.isArmed()).toBe(true);
    expect((AudioArmer as any).earcons.size).toBe(earconCount);

    createEarconSpy.mockRestore();
  });
});
