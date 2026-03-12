import { expect, test, describe, beforeEach, spyOn, mock, afterEach } from "bun:test";
import { BatteryGuardClass } from "../../src/utils/BatteryGuard";

// Mock for BatteryManager
class MockBatteryManager extends EventTarget {
  charging = false;
  chargingTime = 0;
  dischargingTime = 0;
  level = 1.0;
  onchargingchange = null;
  onchargingtimechange = null;
  ondischargingtimechange = null;
  onlevelchange = null;
}

describe("BatteryGuardClass", () => {
  let batteryGuard: BatteryGuardClass;
  let mockBattery: MockBatteryManager;

  beforeEach(() => {
    mockBattery = new MockBatteryManager();

    // Ensure navigator is defined
    if (typeof navigator === 'undefined') {
      (global as any).navigator = {} as any;
    }

    // Mock navigator.getBattery
    (navigator as any).getBattery = async () => mockBattery;

    // Mock speechSynthesis on both window and global
    const mockSpeechSynthesis = {
      speak: mock(() => {}),
    };

    if (typeof window === 'undefined') {
      (global as any).window = {} as any;
    }

    (window as any).speechSynthesis = mockSpeechSynthesis;
    (global as any).speechSynthesis = mockSpeechSynthesis;

    // Mock SpeechSynthesisUtterance
    (global as any).SpeechSynthesisUtterance = class {
      text = "";
      volume = 1;
      rate = 1;
      constructor(text: string) {
        this.text = text;
      }
    };

    // Mock document
    if (typeof document === 'undefined') {
      (global as any).document = {
        getElementById: mock(() => null)
      } as any;
    } else {
      spyOn(document, 'getElementById').mockReturnValue(null);
    }

    batteryGuard = new BatteryGuardClass();
  });

  afterEach(() => {
    // Clean up
  });

  test("should initialize successfully when supported", async () => {
    await batteryGuard.initialize();
    expect(batteryGuard.isSupported()).toBe(true);
    const info = batteryGuard.getBatteryInfo();
    expect(info.level).toBe(1.0);
    expect(info.charging).toBe(false);
  });

  test("should handle low battery level", async () => {
    await batteryGuard.initialize();

    // Simulate low battery
    mockBattery.level = 0.1;
    // Simulate the event that the Battery API would fire
    mockBattery.dispatchEvent(new Event('levelchange'));

    expect(batteryGuard.isLowPower()).toBe(true);

    const settings = batteryGuard.getLowPowerSettings();
    expect(settings.targetFPS).toBe(15);
    expect(settings.cameraResolution).toBe('low');
  });

  test("should not trigger low power if charging even if level is low", async () => {
    await batteryGuard.initialize();

    mockBattery.level = 0.1;
    mockBattery.charging = true;
    mockBattery.dispatchEvent(new Event('levelchange'));

    expect(batteryGuard.isLowPower()).toBe(false);
  });

  test("should exit low power mode when charging starts", async () => {
    await batteryGuard.initialize();

    // Low battery, not charging
    mockBattery.level = 0.1;
    mockBattery.charging = false;
    mockBattery.dispatchEvent(new Event('levelchange'));
    expect(batteryGuard.isLowPower()).toBe(true);

    // Start charging
    mockBattery.charging = true;
    mockBattery.dispatchEvent(new Event('chargingchange'));

    expect(batteryGuard.isLowPower()).toBe(false);
  });

  test("should notify subscribers on low power mode change", async () => {
    await batteryGuard.initialize();
    const callback = mock((isLowPower: boolean) => {});
    batteryGuard.onLowPowerModeChange(callback);

    mockBattery.level = 0.1;
    mockBattery.dispatchEvent(new Event('levelchange'));

    expect(callback).toHaveBeenCalledWith(true);
  });

  test("should trigger TTS alert on low battery", async () => {
    await batteryGuard.initialize();

    mockBattery.level = 0.1;
    mockBattery.dispatchEvent(new Event('levelchange'));

    expect(speechSynthesis.speak).toHaveBeenCalled();
  });

  test("should update status announcer element if present", async () => {
    const mockEl = { textContent: "" };
    spyOn(document, 'getElementById').mockReturnValue(mockEl as any);

    await batteryGuard.initialize();

    mockBattery.level = 0.1;
    mockBattery.dispatchEvent(new Event('levelchange'));

    expect(mockEl.textContent).toContain("Battery low");
  });

  test("should support manual low power mode control", () => {
    batteryGuard.setManualLowPowerMode(true);
    expect(batteryGuard.isLowPower()).toBe(true);

    batteryGuard.setManualLowPowerMode(false);
    expect(batteryGuard.isLowPower()).toBe(false);
  });

  test("should provide normal power settings when not in low power mode", () => {
    const settings = batteryGuard.getLowPowerSettings();
    expect(settings.targetFPS).toBe(30);
    expect(settings.cameraResolution).toBe('medium');
    expect(settings.enableHaptics).toBe(true);
  });

  test("should handle missing battery API", async () => {
    // Save original
    const originalGetBattery = navigator.getBattery;
    // @ts-ignore
    delete navigator.getBattery;

    const unsupportedGuard = new BatteryGuardClass();
    await unsupportedGuard.initialize();

    expect(unsupportedGuard.isSupported()).toBe(false);
    expect(unsupportedGuard.getBatteryInfo().supported).toBe(false);

    // Restore
    (navigator as any).getBattery = originalGetBattery;
  });
});
