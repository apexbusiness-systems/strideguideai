import { expect, test, mock, describe, beforeEach, afterEach, spyOn, setSystemTime } from "bun:test";
import { telemetry } from "./Telemetry";

mock.module("@/config/runtime", () => ({
  getFlagSnapshot: () => ({ testFlag: true }),
}));

describe("TelemetryTracker", () => {
  beforeEach(() => {
    telemetry.clear();
    setSystemTime(new Date("2023-01-01T00:00:00Z"));
  });

  afterEach(() => {
    setSystemTime(); // Reset
  });

  test("generateCorrelationId returns expected format", () => {
    const id = telemetry.generateCorrelationId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    expect(id).toContain(Date.now().toString());
  });

  test("track adds an event", () => {
    const metadata = { foo: "bar" };
    const id = telemetry.track("start_guidance", metadata);

    const events = telemetry.getRecentEvents();
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("start_guidance");
    expect(events[0].correlationId).toBe(id);
    expect(events[0].timestamp).toBe(Date.now());
    expect(events[0].metadata).toEqual(metadata);
    expect(events[0].flagSnapshot).toEqual({ testFlag: true });
  });

  test("track respects maxEvents limit", () => {
    for (let i = 0; i < 1000; i++) {
      telemetry.track("start_guidance", { i });
    }

    expect(telemetry.getRecentEvents(2000)).toHaveLength(1000);
    expect(telemetry.getRecentEvents(2000)[0].metadata).toEqual({ i: 0 });

    telemetry.track("start_guidance", { i: 1000 });
    const events = telemetry.getRecentEvents(2000);
    expect(events).toHaveLength(1000);
    expect(events[0].metadata).toEqual({ i: 1 });
    expect(events[999].metadata).toEqual({ i: 1000 });
  });

  test("trackWithLatency records latency on success", async () => {
    const perfSpy = spyOn(performance, 'now')
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(250);

    const result = await telemetry.trackWithLatency("find_item_open", async () => {
      return "done";
    }, { meta: "data" });

    expect(result).toBe("done");
    const events = telemetry.getRecentEvents();
    expect(events).toHaveLength(1);
    expect(events[0].latency).toBe(150);
    expect(events[0].event).toBe("find_item_open");
    expect(events[0].metadata).toEqual({ meta: "data" });

    perfSpy.mockRestore();
  });

  test("trackWithLatency records error and rethrows", async () => {
    const perfSpy = spyOn(performance, 'now')
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(200);

    const promise = telemetry.trackWithLatency("settings_save", async () => {
      throw new Error("failed");
    });

    await expect(promise).rejects.toThrow("failed");

    const events = telemetry.getRecentEvents();
    expect(events).toHaveLength(1);
    expect(events[0].error).toBe("failed");
    expect(events[0].latency).toBe(100);

    perfSpy.mockRestore();
  });

  test("getErrorCount filters by event and time", async () => {
    const now = Date.now();

    // Recent error
    setSystemTime(now - 10000);
    await telemetry.trackWithLatency("auth_signin", async () => { throw new Error("e1") }).catch(() => {});

    // Old error (more than 24h ago)
    setSystemTime(now - 90000000);
    await telemetry.trackWithLatency("auth_signin", async () => { throw new Error("e2") }).catch(() => {});

    // Different event error
    setSystemTime(now - 5000);
    await telemetry.trackWithLatency("auth_signup", async () => { throw new Error("e3") }).catch(() => {});

    // Recent success
    setSystemTime(now - 2000);
    await telemetry.trackWithLatency("auth_signin", async () => {});

    setSystemTime(now);
    expect(telemetry.getErrorCount("auth_signin")).toBe(1);
    expect(telemetry.getErrorCount("auth_signin", now - 100000000)).toBe(2);
  });

  test("getP95Latency calculates correctly", async () => {
    const event = "payment_success";

    let p = 1000;
    const perfSpy = spyOn(performance, 'now').mockImplementation(() => {
      const val = p;
      p += 100;
      return val;
    });

    for (let i = 0; i < 20; i++) {
        await telemetry.trackWithLatency(event, async () => {});
    }

    expect(telemetry.getP95Latency(event)).toBe(100);

    perfSpy.mockImplementationOnce(() => 10000);
    perfSpy.mockImplementationOnce(() => 10500);
    await telemetry.trackWithLatency(event, async () => {});

    expect(telemetry.getP95Latency(event)).toBe(100);

    perfSpy.mockImplementationOnce(() => 20000);
    perfSpy.mockImplementationOnce(() => 21000);
    await telemetry.trackWithLatency(event, async () => {});

    expect(telemetry.getP95Latency(event)).toBe(500);

    perfSpy.mockRestore();
  });

  test("getP95Latency returns null if no data", () => {
    expect(telemetry.getP95Latency("start_guidance")).toBeNull();
  });

  test("clear removes all events", () => {
    telemetry.track("start_guidance");
    expect(telemetry.getRecentEvents()).toHaveLength(1);
    telemetry.clear();
    expect(telemetry.getRecentEvents()).toHaveLength(0);
  });
});
