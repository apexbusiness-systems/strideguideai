import { expect, test, describe, beforeEach, spyOn, mock, afterEach } from "bun:test";

// Define globals BEFORE anything else
const globalAny = global as any;
if (typeof globalAny.window === 'undefined') {
  globalAny.window = {
    addEventListener: mock(() => {}),
    matchMedia: mock(() => ({
      matches: false,
      addEventListener: mock(() => {}),
    })),
    navigator: {
      userAgent: 'Mozilla/5.0'
    },
    document: {
      referrer: ''
    }
  };
}

if (typeof globalAny.navigator === 'undefined') {
  globalAny.navigator = globalAny.window.navigator;
}

if (typeof globalAny.document === 'undefined') {
  globalAny.document = globalAny.window.document;
}

if (typeof globalAny.localStorage === 'undefined') {
  globalAny.localStorage = {
    getItem: mock(() => null),
    setItem: mock(() => {}),
  };
}

import { InstallManagerClass } from "../../src/utils/InstallManager";

describe("InstallManagerClass", () => {
  let installManager: InstallManagerClass;
  let mockEventListeners: Record<string, Function[]> = {};

  beforeEach(() => {
    mockEventListeners = {};

    // Mock window methods that might be called
    spyOn(window, 'addEventListener').mockImplementation((event: string, cb: any) => {
      if (!mockEventListeners[event]) mockEventListeners[event] = [];
      mockEventListeners[event].push(cb);
    });

    spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      addEventListener: mock(() => {}),
    } as any);

    // Mock localStorage methods
    const store: Record<string, string> = {};
    spyOn(localStorage, 'getItem').mockImplementation((key: string) => store[key] || null);
    spyOn(localStorage, 'setItem').mockImplementation((key: string, value: string) => { store[key] = value; });

    installManager = new InstallManagerClass();
  });

  test("should handle showInstallPrompt on iOS", async () => {
    const originalUA = navigator.userAgent;
    (navigator as any).userAgent = 'iPhone';
    const iosManager = new InstallManagerClass();
    const result = await iosManager.showInstallPrompt();
    expect(result.success).toBe(false);
    expect(result.outcome).toBe('manual_required');
    (navigator as any).userAgent = originalUA;
  });

  test("should handle showInstallPrompt when no prompt is deferred", async () => {
    const result = await installManager.showInstallPrompt();
    expect(result.success).toBe(false);
    expect(result.outcome).toBe('no_prompt');
  });

  test("should handle successful install prompt", async () => {
    const mockEvent = {
      preventDefault: mock(() => {}),
      prompt: mock(() => Promise.resolve()),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };

    if (mockEventListeners['beforeinstallprompt']) {
      const handler = mockEventListeners['beforeinstallprompt'][0];
      handler(mockEvent);

      const result = await installManager.showInstallPrompt();
      expect(result.success).toBe(true);
      expect(result.outcome).toBe('accepted');
    }
  });

  test("should handle error in showInstallPrompt", async () => {
    const mockEvent = {
      preventDefault: mock(() => {}),
      prompt: mock(() => { throw new Error("Mock error"); }),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };

    if (mockEventListeners['beforeinstallprompt']) {
      const handler = mockEventListeners['beforeinstallprompt'][0];
      handler(mockEvent);

      const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

      const result = await installManager.showInstallPrompt();
      expect(result.success).toBe(false);
      expect(result.outcome).toBe('error');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    }
  });
});
