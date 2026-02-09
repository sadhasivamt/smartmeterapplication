# Demo Mode Configuration Guide

## Overview

The Automated Logging Solution (ALS) includes a centralized demo mode configuration system that allows developers to easily switch between **mock data (demo mode)** and **real API data** by changing a single configuration value.

---

## Quick Start

### Enable Demo Mode (Use Mock Data)

1. Open `/src/config/demo.ts`
2. Set `FORCE_DEMO_MODE` to `true`:

```typescript
export const FORCE_DEMO_MODE = true; // ✅ Demo mode enabled
```

3. Save the file and refresh the application
4. The app will automatically log you in with demo credentials and use mock data

### Disable Demo Mode (Use Real API Data)

1. Open `/src/config/demo.ts`
2. Set `FORCE_DEMO_MODE` to `false`:

```typescript
export const FORCE_DEMO_MODE = false; // ❌ Demo mode disabled
```

3. Save the file and refresh the application
4. **The app will automatically clear any lingering demo mode data**
5. Login with your real API credentials
6. All data will come from your backend server

---

## Configuration File

**Location:** `/src/config/demo.ts`

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `FORCE_DEMO_MODE` | `boolean` | `false` | Global demo mode switch |
| `DEMO_USER` | `object` | - | Demo user credentials |

### Example Configuration

```typescript
// Enable demo mode globally
export const FORCE_DEMO_MODE = true;

// Demo user credentials (used when FORCE_DEMO_MODE is true)
export const DEMO_USER = {
  userName: "demo.user",
  userEmail: "demo.user@example.com",
  userRole: "admin",
  authToken: "demo-token-12345",
};
```

---

## How It Works

### When `FORCE_DEMO_MODE = true`

**What happens:**
- Application automatically logs in with demo credentials on page load
- All API calls are bypassed and return mock data
- No backend server is required
- Demo mode cannot be disabled at runtime (config must be changed)
- User sees mock data across all pages (Dashboard, Labs, Set Details, Admin)

**Use Cases:**
- Development without a backend server
- Demonstrations and presentations
- UI testing and development
- Quick prototyping

### When `FORCE_DEMO_MODE = false`

**What happens:**
- User must manually enter credentials to login
- All API calls go to the real backend server
- Authentication requires valid JWT tokens
- **Auto-enable demo mode on API errors is DISABLED**
- If API connection fails, user sees error message instead of auto-login
- All data comes from the actual database

**Use Cases:**
- Production environment
- Development with a running backend server
- Testing real API integration
- Real user authentication testing

**Important:** When `FORCE_DEMO_MODE = false`, the application will NOT automatically enable demo mode even if the API is unreachable. Users will see proper error messages and must have a working backend server.

---

## Demo Mode Behavior

### Pages That Use Demo Mode

All pages check the demo mode configuration and adjust their behavior:

| Page | Demo Mode Behavior |
|------|-------------------|
| **Auth Page** | Auto-login with demo credentials |
| **Dashboard** | Shows mock log collections data |
| **Labs Page** | Shows mock lab, cabinet, and set data |
| **Set Details Page** | Shows mock device data |
| **Admin/Users Page** | Shows mock user management data |

### API Calls in Demo Mode

When demo mode is enabled (either via config or runtime):

- ✅ **Login API** → Bypassed, auto-login with demo user
- ✅ **Logout API** → Bypassed, clears session locally
- ✅ **Labs API** → Returns mock lab data
- ✅ **Lab Details API** → Returns mock cabinet data
- ✅ **Sets API** → Returns mock set data
- ✅ **Dashboard API** → Returns mock log collections
- ✅ **Users API** → Returns mock user list
- ✅ **All Other APIs** → Return appropriate mock data

---

## Global Synchronization

Demo mode state is globally synchronized across:

- ✅ **All Pages** - When enabled/disabled, all pages update instantly
- ✅ **All Browser Tabs** - Changes sync across multiple tabs
- ✅ **Page Refreshes** - Demo mode state persists across refreshes
- ✅ **Local Storage** - State is saved in browser storage

### Runtime Demo Mode Toggle

Even when `FORCE_DEMO_MODE = false`, users can still enable demo mode at runtime:

1. API configuration errors automatically enable demo mode
2. Demo mode can be manually enabled via the API config dialog
3. Once enabled, demo mode persists until logout

**Note:** When `FORCE_DEMO_MODE = true`, demo mode **cannot** be disabled at runtime.

---

## Development Workflow

### For Frontend Development (No Backend)

```typescript
// /src/config/demo.ts
export const FORCE_DEMO_MODE = true; // ✅ Enable demo mode
```

**Benefits:**
- No backend setup required
- Instant development setup
- Full feature testing with mock data
- No API configuration needed

### For Backend Integration Testing

```typescript
// /src/config/demo.ts
export const FORCE_DEMO_MODE = false; // ❌ Disable demo mode
```

**Requirements:**
- Backend server must be running
- API endpoints must be configured in `/src/config/api.ts`
- Valid user credentials required
- Database must be populated

### For Production Deployment

```typescript
// /src/config/demo.ts
export const FORCE_DEMO_MODE = false; // ❌ Demo mode OFF for production
```

**Important:** Always set `FORCE_DEMO_MODE = false` in production!

---

## Utility Functions

The application provides utility functions for demo mode management:

### Import

```typescript
import { enableDemoMode, disableDemoMode, isDemoModeEnabled } from '../utils/demoMode';
import { FORCE_DEMO_MODE, DEMO_USER } from '../config/demo';
```

### Functions

```typescript
// Enable demo mode at runtime (if not forced)
enableDemoMode();

// Disable demo mode at runtime (if not forced)
disableDemoMode();

// Check if demo mode is currently enabled
const isDemo = isDemoModeEnabled(); // true or false

// Check if demo mode is forced in config
if (FORCE_DEMO_MODE) {
  console.log('Demo mode is forced in config');
}
```

---

## Console Logging

The application logs demo mode status to the browser console for developers:

### Check Current Mode

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for colored status messages:
   - 🔧 **Blue** - Configuration status
   - ⚠️ **Orange** - Demo mode enabled
   - ✅ **Green** - Demo mode disabled

### Example Console Output

**Demo Mode ON:**
```
🔧 Demo Mode is FORCED ON in config (using mock data)
⚠️  Demo Mode is ENABLED in config/demo.ts
   All API calls will use mock data
🔧 FORCE_DEMO_MODE is enabled - Auto-logging in with demo credentials
```

**Demo Mode OFF:**
```
🔧 Demo Mode is DISABLED in config/demo.ts
✅ Demo Mode is DISABLED in config/demo.ts
   Application will use real API endpoints
```

---

## Troubleshooting

### Issue: Application still shows demo data after disabling

**Solution:**
1. Set `FORCE_DEMO_MODE = false` in `/src/config/demo.ts`
2. Clear browser localStorage using one of these methods:

   **Method 1: Use Browser DevTools**
   - Open DevTools (F12)
   - Go to Console tab
   - Type: `localStorage.clear(); sessionStorage.clear();`
   - Press Enter
   - Refresh the page

   **Method 2: Use Built-in Utility**
   - Open DevTools (F12)
   - Go to Console tab
   - Type: `clearDemoModeData()`
   - Press Enter
   - Refresh the page

   **Method 3: Use Application Storage Tab**
   - Open DevTools (F12)
   - Go to Application tab (Chrome) or Storage tab (Firefox)
   - Click "Local Storage" → Select your domain
   - Click "Clear All" button
   - Do the same for "Session Storage"
   - Refresh the page

3. Check console for confirmation that demo mode is disabled

### Issue: Cannot disable demo mode

**Cause:** `FORCE_DEMO_MODE = true` in config

**Solution:**
- When `FORCE_DEMO_MODE = true`, demo mode is permanently enabled
- Set `FORCE_DEMO_MODE = false` to allow runtime toggling

### Issue: API calls not working after disabling demo mode

**Solution:**
1. Ensure backend server is running
2. Check API configuration in `/src/config/api.ts`
3. Verify `VITE_API_BASE_URL` environment variable
4. Check browser console for API errors
5. Use the console utility to check status:
   ```javascript
   checkDemoModeConfig()
   ```

### Issue: Lingering demo mode state after switching

**Root Cause:** localStorage still contains `demoMode: "true"` from previous session

**Complete Solution:**
1. Set `FORCE_DEMO_MODE = false` in `/src/config/demo.ts`
2. Save the file
3. Open Browser DevTools (F12)
4. Go to Console tab
5. Run: `clearDemoModeData()`
6. Refresh the application
7. Login with real credentials

---

## Environment Variables

For API configuration, see `/src/config/api.ts`:

```bash
# .env file
VITE_API_BASE_URL=https://your-api-server.com
```

**Note:** Demo mode does not require environment variables to be set.

---

## Summary

- ✅ **Simple Toggle:** Change one boolean in `/src/config/demo.ts`
- ✅ **Global Sync:** All pages update automatically
- ✅ **Persistent:** State survives page refreshes
- ✅ **Development-Friendly:** No backend needed for frontend dev
- ✅ **Production-Ready:** Easy to disable for deployment
- ✅ **Console Logging:** Clear status messages in DevTools

For more information, see:
- `/src/config/demo.ts` - Demo mode configuration
- `/src/utils/demoMode.ts` - Demo mode utilities
- `/src/config/api.ts` - API endpoint configuration