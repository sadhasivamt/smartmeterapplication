# Testing Demo Mode Configuration

This guide helps you verify that the demo mode configuration system is working correctly.

---

## Prerequisites

- Application is running (`npm run dev` or similar)
- Browser DevTools available (F12)
- Access to `/src/config/demo.ts` file

---

## Test Suite 1: FORCE_DEMO_MODE = false (Real API Mode)

### Test 1.1: Prevent Auto-Login
**Goal:** Verify demo mode does NOT auto-enable on page load

**Steps:**
1. Set `FORCE_DEMO_MODE = false` in `/src/config/demo.ts`
2. Save the file
3. Clear browser storage:
   - Open DevTools (F12) → Console
   - Run: `localStorage.clear(); sessionStorage.clear();`
4. Refresh the page

**Expected Results:**
- ✅ Console shows: "✅ Demo Mode is DISABLED in config/demo.ts"
- ✅ Login page is displayed
- ✅ No auto-login occurs
- ✅ User must manually enter credentials

**Fail Indicators:**
- ❌ Auto-login occurs
- ❌ Dashboard page loads automatically
- ❌ Console shows demo mode is enabled

---

### Test 1.2: API Error Shows Error Message (Not Auto-Demo)
**Goal:** Verify API errors show proper error messages instead of enabling demo mode

**Steps:**
1. Ensure `FORCE_DEMO_MODE = false`
2. Stop your backend server (or use invalid API endpoint)
3. Try to login with any credentials (e.g., test@example.com / password123)
4. Click "Sign In" button

**Expected Results:**
- ✅ Error toast appears: "API Connection Failed"
- ✅ Description: "Cannot connect to the backend server..."
- ✅ User is NOT logged in
- ✅ Login page remains visible
- ✅ Console shows: "API Configuration Error: Cannot reach backend server"

**Fail Indicators:**
- ❌ Success toast: "Demo Mode Activated"
- ❌ User is logged in with demo credentials
- ❌ Dashboard page loads

---

### Test 1.3: Real API Authentication Works
**Goal:** Verify real API authentication works when backend is available

**Steps:**
1. Ensure `FORCE_DEMO_MODE = false`
2. Start your backend server
3. Verify API endpoint is correct in `/src/config/api.ts`
4. Enter valid backend credentials
5. Click "Sign In"

**Expected Results:**
- ✅ Toast: "Login successful!"
- ✅ User is logged in with real credentials
- ✅ Dashboard loads with real API data
- ✅ Network tab shows real API calls (not mock data)

**Fail Indicators:**
- ❌ Demo mode is activated
- ❌ Mock data is shown
- ❌ API calls are not made

---

### Test 1.4: Auto-Cleanup of Lingering Demo Data
**Goal:** Verify automatic cleanup when demo data exists in localStorage

**Steps:**
1. Set `FORCE_DEMO_MODE = true` → Refresh → Get demo mode active
2. Set `FORCE_DEMO_MODE = false` → Save file
3. Refresh the page
4. Check the console

**Expected Results:**
- ✅ Console shows: "🧹 Auto-cleaning demo mode data..."
- ✅ Console shows: "✅ Demo mode data cleared successfully!"
- ✅ Console shows: "Ready for real API authentication"
- ✅ Login page is displayed
- ✅ localStorage is cleared of demo data

**Fail Indicators:**
- ❌ Auto-login with demo credentials
- ❌ Demo data persists
- ❌ No cleanup message in console

---

## Test Suite 2: FORCE_DEMO_MODE = true (Demo Mode)

### Test 2.1: Auto-Login on Page Load
**Goal:** Verify automatic login with demo credentials

**Steps:**
1. Set `FORCE_DEMO_MODE = true` in `/src/config/demo.ts`
2. Save the file
3. Clear browser storage (optional, but recommended):
   - DevTools → Console → `localStorage.clear(); sessionStorage.clear();`
4. Refresh the page

**Expected Results:**
- ✅ Console shows: "⚠️ Demo Mode is ENABLED in config/demo.ts"
- ✅ Console shows: "🔧 FORCE_DEMO_MODE is enabled - Auto-logging in..."
- ✅ Auto-login occurs immediately
- ✅ Dashboard loads with mock data
- ✅ No login page shown

**Fail Indicators:**
- ❌ Login page is displayed
- ❌ User must manually login
- ❌ No auto-login occurs

---

### Test 2.2: Mock Data Across All Pages
**Goal:** Verify all pages use mock data

**Steps:**
1. Ensure `FORCE_DEMO_MODE = true`
2. Refresh page to auto-login
3. Navigate to each page:
   - Dashboard
   - Labs
   - Set Details (select a lab/set)
   - Admin Users

**Expected Results:**
- ✅ Dashboard shows mock log collections
- ✅ Labs page shows mock lab/cabinet/set data
- ✅ Set Details shows mock device data
- ✅ Admin page shows mock user list
- ✅ No real API calls are made (check Network tab)

**Fail Indicators:**
- ❌ Real API calls in Network tab
- ❌ Empty data or errors
- ❌ API authentication failures

---

### Test 2.3: API Errors Auto-Enable Demo Mode
**Goal:** Verify API errors automatically enable demo mode when forced

**Steps:**
1. Ensure `FORCE_DEMO_MODE = true`
2. Logout (if logged in)
3. Stop backend server
4. Try to login with any credentials

**Expected Results:**
- ✅ Demo mode activates automatically
- ✅ Toast: "Demo Mode Activated - Login Successful!"
- ✅ User is logged in with demo credentials
- ✅ Dashboard shows mock data

**Fail Indicators:**
- ❌ Error message instead of demo mode
- ❌ User is not logged in

---

## Test Suite 3: Console Utilities

### Test 3.1: clearDemoModeData() Function
**Goal:** Verify manual demo data cleanup utility

**Steps:**
1. Enable demo mode (any method)
2. Verify demo data exists: `localStorage.getItem("demoMode")`
3. Open DevTools → Console
4. Run: `clearDemoModeData()`
5. Check result

**Expected Results:**
- ✅ Console shows: "🧹 Clearing all demo mode data..."
- ✅ Console shows: "✅ All demo mode data cleared!"
- ✅ localStorage is empty
- ✅ sessionStorage is empty

**Fail Indicators:**
- ❌ Function not found
- ❌ Data not cleared
- ❌ Errors in console

---

### Test 3.2: checkDemoModeConfig() Function
**Goal:** Verify demo mode status checker

**Steps:**
1. Open DevTools → Console
2. Run: `checkDemoModeConfig()`
3. Review output

**Expected Results:**
- ✅ Shows current config status
- ✅ Shows runtime status from localStorage
- ✅ Shows effective mode (demo vs real)
- ✅ Returns object with mode details

**Example Output:**
```
🔍 Demo Mode Status Check
   Config (FORCE_DEMO_MODE): ❌ DISABLED
   Runtime (localStorage): ❌ DISABLED
   Effective Mode: REAL API MODE
```

**Fail Indicators:**
- ❌ Function not found
- ❌ Incorrect status shown
- ❌ Errors in console

---

## Test Suite 4: Edge Cases

### Test 4.1: Switching Modes Multiple Times
**Goal:** Verify clean switching between modes

**Steps:**
1. Set `FORCE_DEMO_MODE = true` → Refresh → Verify demo mode
2. Set `FORCE_DEMO_MODE = false` → Refresh → Verify real mode
3. Set `FORCE_DEMO_MODE = true` → Refresh → Verify demo mode
4. Repeat 2-3 times

**Expected Results:**
- ✅ Each switch works correctly
- ✅ No data conflicts
- ✅ No stale state
- ✅ Clean transitions

**Fail Indicators:**
- ❌ Mode doesn't switch properly
- ❌ Mixed demo/real data
- ❌ Errors during switching

---

### Test 4.2: localStorage Conflicts
**Goal:** Verify handling of conflicting localStorage state

**Steps:**
1. Set `FORCE_DEMO_MODE = false`
2. Manually set demo mode in console: `localStorage.setItem("demoMode", "true")`
3. Refresh the page

**Expected Results:**
- ✅ Auto-cleanup detects conflict
- ✅ Console shows: "🧹 Auto-cleaning demo mode data..."
- ✅ Demo data is cleared automatically
- ✅ Login page is shown

**Fail Indicators:**
- ❌ Demo mode persists
- ❌ Auto-login occurs
- ❌ No cleanup happens

---

## Test Suite 5: Production Readiness

### Test 5.1: Verify Production Config
**Goal:** Ensure demo mode is disabled for production

**Steps:**
1. Open `/src/config/demo.ts`
2. Check `FORCE_DEMO_MODE` value

**Expected Results:**
- ✅ `FORCE_DEMO_MODE = false` for production builds
- ✅ Backend server is configured and running
- ✅ API endpoints are correctly set

**Fail Indicators:**
- ❌ `FORCE_DEMO_MODE = true` in production
- ❌ Demo mode enabled for production users

---

### Test 5.2: Real User Authentication in Production
**Goal:** Verify real users can authenticate

**Steps:**
1. Deploy with `FORCE_DEMO_MODE = false`
2. Access the application
3. Try to login with valid credentials

**Expected Results:**
- ✅ Real authentication works
- ✅ JWT tokens are generated
- ✅ User data from database
- ✅ No demo mode available

**Fail Indicators:**
- ❌ Demo mode activates
- ❌ Mock data is shown
- ❌ Cannot login with real credentials

---

## Quick Test Checklist

### Before Each Release

- [ ] Verify `FORCE_DEMO_MODE = false` in `/src/config/demo.ts`
- [ ] Test real API authentication works
- [ ] Verify demo mode does NOT auto-activate
- [ ] Check console for no demo mode warnings
- [ ] Verify all API calls use real endpoints
- [ ] Test error handling shows proper messages

### For Demo/Development

- [ ] Set `FORCE_DEMO_MODE = true`
- [ ] Verify auto-login works
- [ ] Check all pages show mock data
- [ ] Verify no backend is required
- [ ] Test all features work with mock data

---

## Troubleshooting Tests

### If Test Fails: Auto-Login Still Occurs When FORCE_DEMO_MODE = false

**Debug Steps:**
1. Check console for demo mode status messages
2. Run `checkDemoModeConfig()` in console
3. Check if localStorage has demo data: `localStorage.getItem("demoMode")`
4. Clear all data: `clearDemoModeData()`
5. Verify `/src/config/demo.ts` has `FORCE_DEMO_MODE = false`
6. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### If Test Fails: API Errors Auto-Enable Demo Mode When They Shouldn't

**Debug Steps:**
1. Check `/src/config/demo.ts` - ensure `FORCE_DEMO_MODE = false`
2. Check `/src/app/components/auth-page.tsx` line ~212-230
3. Verify the code checks `if (FORCE_DEMO_MODE)` before enabling demo mode
4. Check console for error message instead of success toast
5. Verify "API Connection Failed" error is shown

---

## Success Criteria

### All Tests Pass When:
- ✅ `FORCE_DEMO_MODE = true` → Demo mode works perfectly
- ✅ `FORCE_DEMO_MODE = false` → Real API mode works perfectly
- ✅ No auto-demo-mode when config is false
- ✅ Proper error messages when API fails
- ✅ Auto-cleanup removes lingering demo data
- ✅ Console utilities work correctly
- ✅ No data conflicts when switching modes

---

## Automated Test Script (Optional)

You can run this in the browser console to quick-test:

```javascript
// Quick Demo Mode Test Script
async function testDemoModeConfig() {
  console.log("🧪 Running Demo Mode Tests...");
  
  // Test 1: Check config
  console.log("\n📋 Test 1: Checking configuration...");
  const status = checkDemoModeConfig();
  console.log("Config:", status);
  
  // Test 2: Check localStorage
  console.log("\n📋 Test 2: Checking localStorage...");
  const demoMode = localStorage.getItem("demoMode");
  console.log("localStorage.demoMode:", demoMode);
  
  // Test 3: Check auth token
  console.log("\n📋 Test 3: Checking auth token...");
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  console.log("Auth Token:", token ? "Present" : "Not Found");
  
  console.log("\n✅ Tests Complete! Review results above.");
}

// Run the test
testDemoModeConfig();
```

---

## Contact & Support

If tests fail unexpectedly:
1. Review console error messages
2. Check `/DEMO_MODE_CONFIG.md` for detailed documentation
3. Check `/DEMO_MODE_FIX_SUMMARY.md` for recent fixes
4. Use `clearDemoModeData()` to reset state
5. Hard refresh and retry
