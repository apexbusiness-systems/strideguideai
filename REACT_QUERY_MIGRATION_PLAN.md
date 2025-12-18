# 🔄 React Query Migration Plan
**Date:** December 18, 2025  
**Status:** ⏸️ DEFERRED - Q2 2026  
**Priority:** Medium (Nice-to-have optimization)

---

## 🎯 OBJECTIVE

Migrate direct Supabase queries to React Query for better caching, background refetching, and optimistic updates.

**Current State:**
- React Query configured but not used
- Direct Supabase calls throughout codebase
- No query caching
- No background refetching

**Target State:**
- All data fetching via React Query
- Automatic caching and invalidation
- Background refetching
- Optimistic updates where appropriate

---

## 📊 SCOPE ANALYSIS

**Files to Migrate:**
1. `src/hooks/useSubscription.ts` - High priority
2. `src/hooks/useAdminAccess.ts` - High priority
3. `src/pages/DashboardPage.tsx` - Medium priority
4. Other data-fetching hooks - Low priority

**Estimated Effort:** 9-13 hours (1.5-2 days)

---

## 🚀 MIGRATION STRATEGY

### Phase 1: High-Frequency Queries (4-6 hours)

#### 1.1: useSubscription Hook
**Current:**
```typescript
const { data, error } = await supabase.rpc('get_user_subscription', {
  user_uuid: user.id
});
```

**After:**
```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ['subscription', user?.id],
  queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase.rpc('get_user_subscription', {
      user_uuid: user.id
    });
    if (error) throw error;
    return data;
  },
  enabled: !!user,
  staleTime: 1000 * 60 * 30, // 30 minutes
});
```

**Benefits:**
- Automatic caching
- Background refetching
- Loading states handled
- Error handling improved

#### 1.2: useAdminAccess Hook
**Current:**
```typescript
const { data } = await supabase.functions.invoke('check-admin-access');
```

**After:**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['admin-access', user?.id],
  queryFn: async () => {
    const { data, error } = await supabase.functions.invoke('check-admin-access');
    if (error) throw error;
    return data;
  },
  enabled: !!user,
  staleTime: 1000 * 60 * 60, // 1 hour (admin status rarely changes)
});
```

**Timeline:** Week 1 (when migration starts)

---

### Phase 2: Medium-Frequency Queries (3-4 hours)

#### 2.1: Dashboard Data
- User profile data
- Settings data
- Usage statistics

**Timeline:** Week 2

---

### Phase 3: Low-Frequency Queries (2-3 hours)

#### 3.1: Historical Data
- Past usage
- Audit logs
- Reports

**Timeline:** Week 3

---

## 📋 MIGRATION PATTERNS

### Pattern 1: Simple Query
```typescript
// Before
const [data, setData] = useState(null);
useEffect(() => {
  supabase.from('table').select().then(({ data }) => setData(data));
}, []);

// After
const { data } = useQuery({
  queryKey: ['table'],
  queryFn: () => supabase.from('table').select().then(({ data }) => data),
});
```

### Pattern 2: Query with Parameters
```typescript
// Before
const [data, setData] = useState(null);
useEffect(() => {
  if (userId) {
    supabase.from('table').select().eq('user_id', userId).then(({ data }) => setData(data));
  }
}, [userId]);

// After
const { data } = useQuery({
  queryKey: ['table', userId],
  queryFn: () => supabase.from('table').select().eq('user_id', userId).then(({ data }) => data),
  enabled: !!userId,
});
```

### Pattern 3: Mutation
```typescript
// Before
const handleUpdate = async () => {
  await supabase.from('table').update({ ... }).eq('id', id);
  // Manual refetch
};

// After
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data) => supabase.from('table').update(data).eq('id', id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['table'] });
  },
});
```

---

## ✅ VALIDATION CHECKLIST

### Phase 1
- [ ] useSubscription migrated
- [ ] useAdminAccess migrated
- [ ] Caching works correctly
- [ ] Background refetching works
- [ ] Tests pass
- [ ] No performance regressions

### Phase 2
- [ ] Dashboard queries migrated
- [ ] All queries cached properly
- [ ] Loading states handled
- [ ] Error states handled

### Phase 3
- [ ] All queries migrated
- [ ] Optimistic updates added
- [ ] Documentation complete
- [ ] Team trained

---

## 📊 BENEFITS

### Performance
- ✅ Reduced network requests (caching)
- ✅ Faster UI updates (cached data)
- ✅ Background refetching (fresh data)

### Developer Experience
- ✅ Less boilerplate code
- ✅ Better error handling
- ✅ Loading states handled automatically

### User Experience
- ✅ Faster page loads
- ✅ Offline support (cached data)
- ✅ Optimistic updates

---

## ⏸️ DEFERRAL RATIONALE

**Why Defer:**
1. Current implementation works correctly
2. No performance issues identified
3. Higher priority work available
4. Can implement when capacity available

**When to Implement:**
- New feature development
- Performance optimization sprint
- Team has 1-2 days capacity
- Q2 2026 (suggested)

---

## 📝 NOTES

- Migration can be done incrementally
- Each phase is independent
- Can pause/resume as needed
- Low risk (additive changes)

---

**Plan Created:** December 18, 2025  
**Status:** ⏸️ DEFERRED  
**Target Start:** Q2 2026  
**Estimated Effort:** 1.5-2 days
