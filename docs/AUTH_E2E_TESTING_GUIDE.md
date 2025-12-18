# 🧪 Authentication E2E Testing Guide
**Date:** December 18, 2025  
**Project:** StrideGuide  
**Status:** ✅ COMPLETE

---

## 📋 OVERVIEW

This guide documents the End-to-End (E2E) testing strategy for the authentication flow in StrideGuide. E2E tests ensure that the complete user journey works correctly from the user's perspective.

---

## 🧪 TEST FILES

### 1. `e2e/auth.spec.ts` (Basic Tests)
**Purpose:** Basic smoke tests for authentication flow  
**Coverage:**
- Landing page display
- Navigation to auth page
- Invalid credentials error handling

**Run Command:**
```bash
npx playwright test e2e/auth.spec.ts
```

---

### 2. `e2e/auth-comprehensive.spec.ts` (Comprehensive Tests)
**Purpose:** Complete E2E test coverage for all authentication scenarios  
**Coverage:**
- ✅ Sign-up flow (US-001 to US-004)
- ✅ Sign-in flow (US-005 to US-007)
- ✅ Password reset flow (US-008)
- ✅ Form validation (US-016)
- ✅ Loading states (US-015)
- ✅ Navigation
- ✅ Accessibility (US-019)

**Run Command:**
```bash
npx playwright test e2e/auth-comprehensive.spec.ts
```

---

## 🎯 TEST SCENARIOS

### Sign-Up Flow Tests

#### Test: US-001 - New User Registration
```typescript
test('US-001: New user can create an account', async ({ page }) => {
  // Navigate to auth page
  // Fill sign-up form
  // Submit form
  // Verify success message or redirect
});
```

**What it tests:**
- User can navigate to sign-up page
- User can fill all required fields
- Form submission works
- Success feedback is shown

---

#### Test: US-002 - Password Strength Validation
```typescript
test('US-002: Password strength validation works', async ({ page }) => {
  // Enter weak password
  // Verify error message appears
  // Enter strong password
  // Verify error clears
});
```

**What it tests:**
- Real-time password validation
- Error messages display correctly
- Validation clears when requirements met

---

#### Test: US-003 - Email Validation
```typescript
test('US-003: Email validation works', async ({ page }) => {
  // Enter invalid email
  // Verify error message
  // Enter valid email
  // Verify error clears
});
```

**What it tests:**
- Email format validation
- Error messages for invalid emails
- Validation clears for valid emails

---

#### Test: US-004 - Network Error Handling
```typescript
test('US-004: Network error handling works', async ({ page, context }) => {
  // Simulate offline
  // Try to submit form
  // Verify network error message
  // Restore online
});
```

**What it tests:**
- Offline detection
- Network error messages
- User-friendly error handling

---

### Sign-In Flow Tests

#### Test: US-005 - Existing User Sign In
```typescript
test('US-005: Existing user can sign in', async ({ page }) => {
  // Navigate to sign-in
  // Enter credentials
  // Submit form
  // Verify redirect to dashboard
});
```

**What it tests:**
- Sign-in form works
- Authentication succeeds with valid credentials
- User is redirected after sign-in

---

#### Test: US-006 - Invalid Credentials Error
```typescript
test('US-006: Invalid credentials show error', async ({ page }) => {
  // Enter invalid credentials
  // Submit form
  // Verify error message appears
});
```

**What it tests:**
- Error handling for invalid credentials
- User-friendly error messages
- Form doesn't clear on error

---

#### Test: US-007 - Password Visibility Toggle
```typescript
test('US-007: Password visibility toggle works', async ({ page }) => {
  // Enter password
  // Click toggle button
  // Verify password becomes visible
  // Click again
  // Verify password is hidden
});
```

**What it tests:**
- Toggle button works
- Password visibility changes
- Icon updates correctly

---

### Password Reset Tests

#### Test: US-008 - Password Reset Request
```typescript
test('US-008: User can request password reset', async ({ page }) => {
  // Click forgot password link
  // Enter email
  // Submit
  // Verify success message
});
```

**What it tests:**
- Forgot password flow works
- Email is sent
- Success message appears

---

### Form Validation Tests

#### Test: US-016 - Real-Time Validation
```typescript
test('US-016: Real-time validation feedback works', async ({ page }) => {
  // Enter invalid email
  // Verify error appears
  // Enter invalid password
  // Verify error appears
});
```

**What it tests:**
- Real-time validation feedback
- Error messages appear immediately
- Multiple field validation works

---

### Loading States Tests

#### Test: US-015 - Loading States
```typescript
test('US-015: Loading states display correctly', async ({ page }) => {
  // Fill form
  // Submit
  // Verify button is disabled during submission
});
```

**What it tests:**
- Loading states appear
- Form is disabled during submission
- User feedback during processing

---

### Navigation Tests

#### Test: Tab Navigation
```typescript
test('should navigate between sign-in and sign-up tabs', async ({ page }) => {
  // Click sign-up tab
  // Verify sign-up form appears
  // Click sign-in tab
  // Verify sign-in form appears
});
```

**What it tests:**
- Tab switching works
- Forms change correctly
- State is maintained

---

### Accessibility Tests

#### Test: US-019 - Form Labels
```typescript
test('US-019: Form fields have proper labels', async ({ page }) => {
  // Check email field has label
  // Check password field has label
  // Verify accessibility
});
```

**What it tests:**
- Form fields have labels
- ARIA attributes are correct
- Screen reader compatibility

---

## 🚀 RUNNING TESTS

### Run All Auth Tests
```bash
# Run basic tests
npx playwright test e2e/auth.spec.ts

# Run comprehensive tests
npx playwright test e2e/auth-comprehensive.spec.ts

# Run all auth tests
npx playwright test e2e/auth*.spec.ts
```

### Run in Specific Browser
```bash
# Chrome
npx playwright test e2e/auth-comprehensive.spec.ts --project=chromium

# Firefox
npx playwright test e2e/auth-comprehensive.spec.ts --project=firefox

# Safari
npx playwright test e2e/auth-comprehensive.spec.ts --project=webkit
```

### Run with UI Mode
```bash
npx playwright test e2e/auth-comprehensive.spec.ts --ui
```

### Run in Headed Mode
```bash
npx playwright test e2e/auth-comprehensive.spec.ts --headed
```

### Run Specific Test
```bash
npx playwright test e2e/auth-comprehensive.spec.ts -g "US-001"
```

---

## 📊 TEST COVERAGE

| User Story | Test Coverage | Status |
|------------|---------------|--------|
| US-001 | ✅ Sign-up flow | ✅ Covered |
| US-002 | ✅ Password validation | ✅ Covered |
| US-003 | ✅ Email validation | ✅ Covered |
| US-004 | ✅ Network errors | ✅ Covered |
| US-005 | ✅ Sign-in flow | ✅ Covered |
| US-006 | ✅ Invalid credentials | ✅ Covered |
| US-007 | ✅ Password toggle | ✅ Covered |
| US-008 | ✅ Password reset | ✅ Covered |
| US-015 | ✅ Loading states | ✅ Covered |
| US-016 | ✅ Form validation | ✅ Covered |
| US-019 | ✅ Accessibility | ✅ Covered |

**Coverage:** 11/20 user stories (55% of testable stories)  
**Note:** Some stories (US-009, US-010, US-011, etc.) require email service or session management that's harder to test E2E

---

## 🔧 TEST CONFIGURATION

### Environment Variables
```bash
# Test user credentials (optional)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!

# Base URL
PLAYWRIGHT_TEST_BASE_URL=http://localhost:8080
```

### Test Data
- **Test Email Format:** `e2e-test-{timestamp}-{random}@test.strideguide.ai`
- **Test Password:** `TestPassword123!`
- **Test Names:** `E2E Test`

### Test Isolation
- Each test generates unique email addresses
- Tests are independent (can run in parallel)
- No shared state between tests

---

## 🐛 TROUBLESHOOTING

### Tests Failing Due to Network
**Issue:** Tests fail when network is slow or offline  
**Solution:** Increase timeouts in test configuration

```typescript
await page.waitForSelector('input[type="email"]', { timeout: 10000 });
```

### Tests Failing Due to Timing
**Issue:** Tests fail because elements load slowly  
**Solution:** Add explicit waits

```typescript
await page.waitForTimeout(1000); // Wait for async operations
```

### Tests Failing Due to Missing Test Users
**Issue:** Sign-in tests fail because test user doesn't exist  
**Solution:** Set up test users before running tests

```bash
# Create test user via API or seed data
# Or use environment variables for existing test user
```

### Tests Failing Due to Email Verification
**Issue:** Sign-up tests fail because email verification is required  
**Solution:** Configure Supabase to allow unverified sign-ins in test environment

---

## 📝 BEST PRACTICES

1. **Use Unique Test Data**
   - Generate unique emails for each test
   - Avoid hardcoded test credentials

2. **Wait for Elements**
   - Always wait for elements before interacting
   - Use explicit waits, not fixed timeouts

3. **Test User Journey**
   - Test complete flows, not just individual actions
   - Verify end-to-end user experience

4. **Handle Async Operations**
   - Wait for network requests to complete
   - Handle loading states correctly

5. **Clean Up**
   - Remove test data after tests
   - Reset state between tests

---

## 🎯 NEXT STEPS

### Future Test Additions
1. **Email Verification Flow** (US-010)
   - Test email verification link
   - Test verification success

2. **Session Management** (US-011, US-012)
   - Test session persistence
   - Test token refresh

3. **Sign Out Flow** (US-013)
   - Test sign-out functionality
   - Test redirect after sign-out

4. **Error Message Testing** (US-014)
   - Test all error scenarios
   - Verify error message clarity

---

## 📚 RELATED DOCUMENTATION

- **User Stories:** `docs/USER_STORIES_AUTH_FLOW.md`
- **Auth Configuration:** `docs/AUTH_CONFIGURATION_GUIDE.md`
- **Auth Troubleshooting:** `docs/AUTH_TROUBLESHOOTING.md`
- **Playwright Config:** `playwright.config.ts`

---

**Document Created:** December 18, 2025  
**Last Updated:** December 18, 2025  
**Status:** ✅ COMPLETE
