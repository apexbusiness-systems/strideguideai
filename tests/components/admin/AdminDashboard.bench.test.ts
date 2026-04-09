import { describe, it, expect, spyOn, mock } from 'bun:test';

// Mock supabase before importing anything that might use it
const DELAY_MS = 100;

const mockFetch = async () => {
  await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  return { data: [], error: null };
};

const mockSupabase = {
  from: () => ({
    select: () => ({
      eq: () => mockFetch(),
      order: () => ({
        limit: () => mockFetch(),
      }),
      // For profiles select which doesn't have eq
      then: (cb: any) => mockFetch().then(cb),
    })
  })
};

mock.module('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// We'll replicate the loadStats logic here for the baseline since it's internal to the component
const sequentialLoadStats = async (supabase: any) => {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, created_at");

  const { data: activeSubscriptions } = await supabase
    .from("user_subscriptions")
    .select(`
      *,
      subscription_plans!inner(price_monthly)
    `)
    .eq("status", "active");

  const { data: billingEvents } = await supabase
    .from("billing_events")
    .select("amount, created_at")
    .eq("status", "succeeded");

  return { profiles, activeSubscriptions, billingEvents };
};

const parallelLoadStats = async (supabase: any) => {
  const [
    { data: profiles },
    { data: activeSubscriptions },
    { data: billingEvents }
  ] = await Promise.all([
    supabase.from("profiles").select("id, created_at"),
    supabase.from("user_subscriptions")
      .select(`
        *,
        subscription_plans!inner(price_monthly)
      `)
      .eq("status", "active"),
    supabase.from("billing_events")
      .select("amount, created_at")
      .eq("status", "succeeded")
  ]);

  return { profiles, activeSubscriptions, billingEvents };
};

describe('AdminDashboard loadStats Performance', () => {
  it('measures sequential loadStats performance (Baseline)', async () => {
    const start = performance.now();
    await sequentialLoadStats(mockSupabase);
    const end = performance.now();
    const duration = end - start;
    console.log(`Baseline (Sequential) duration: ${duration.toFixed(2)}ms`);

    // Expect at least 3 * DELAY_MS
    expect(duration).toBeGreaterThan(3 * DELAY_MS);
  });

  it('measures parallel loadStats performance (Optimized)', async () => {
    const start = performance.now();
    await parallelLoadStats(mockSupabase);
    const end = performance.now();
    const duration = end - start;
    console.log(`Optimized (Parallel) duration: ${duration.toFixed(2)}ms`);

    // Expect roughly DELAY_MS
    expect(duration).toBeLessThan(2 * DELAY_MS);
  });
});
